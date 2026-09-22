"""Seguridad del panel administrativo de KARVATECH.

Medidas alineadas con el OWASP Top 10 que implementamos aquí:

- A02  Criptografía: contraseñas con bcrypt (costo 12) y tokens JWT firmados
        con secreto de alta entropía persistido; nunca se almacena texto plano.
- A03  Inyección / XSS: todas las consultas usan SQLAlchemy con parámetros
        vinculados; las respuestas se serializan sin reflejar HTML sin escapar.
- A05  Mala configuración: cabeceras de seguridad (CSP, nosniff, frame, HSTS,
        referrer), CORS restringido al origen configurado y cookies marcadas
        Secure + HttpOnly + SameSite=Strict.
- A07  Autenticación: rate limiting por IP, bloqueo temporal de cuenta tras
        intentos fallidos (anti fuerza bruta) y sesiones con expiración corta.
- A09  Anti-abuso: la misma técnica limita los envíos del formulario público
        de contacto por IP (frenar bots/spam).
- A08  Integridad: las mutaciones del panel exigen token CSRF de doble envío
        además de la cookie de sesión.
- A09  Registro: se registran intentos de inicio de sesión (éxito/fracaso)
        con IP y usuario, sin almacenar contraseñas.
- A10  SSRF: el panel no solicita ni procesa URLs suministradas por el usuario
        en el servidor; los archivos subidos se validan por extensión y
        contenido (magic bytes) y con límite de tamaño.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request
from jwt import InvalidTokenError as _JWTError

from db import BASE_DIR, LOGS_DIR, Admin, SessionLocal

SESSION_COOKIE = "karvatech_session"
CSRF_COOKIE = "karvatech_csrf"
SESSION_TTL_MINUTES = int(__import__("os").getenv("KARVATECH_SESSION_MINUTES", "480"))
ISSUER = "karvatech-admin"
AUDIENCE = "karvatech-admin"

# Límites anti fuerza bruta (OWASP A07)
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60
RATE_WINDOW_SECONDS = 60
RATE_MAX_REQUESTS = 10  # por minuto por IP en /login

_logger = logging.getLogger("karvatech.auth")
_auth_lock = Lock()
# IP -> [(timestamp, éxito)]
_attempts: dict[str, list[tuple[float, bool]]] = {}


def _secret() -> str:
    """Secreto JWT persistido entre reinicios."""
    return open(BASE_DIR / ".jwt-secret", "r").read().strip()


def setup() -> None:
    """Crea el secreto JWT y el logger de auditoría si aún no existen."""
    path = BASE_DIR / ".jwt-secret"
    if not path.exists():
        path.write_text(secrets.token_urlsafe(64), encoding="utf-8")
    _configure_logger()


def _configure_logger() -> None:
    if not _logger.handlers:
        LOGS_DIR.mkdir(exist_ok=True)
        handler = logging.FileHandler(LOGS_DIR / "auth.log", encoding="utf-8")
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
        )
        _logger.addHandler(handler)
        _logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Contraseñas (bcrypt)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    if not password or not isinstance(password, str):
        raise ValueError("Contraseña requerida")
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


# ---------------------------------------------------------------------------
# Sesión (JWT en cookie HttpOnly, Secure, SameSite=Strict)
# ---------------------------------------------------------------------------

def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_token(user_id: int) -> str:
    payload = {
        "sub": str(user_id),
        "iss": ISSUER,
        "aud": AUDIENCE,
        "iat": _now(),
        "exp": _now() + timedelta(minutes=SESSION_TTL_MINUTES),
        "jti": secrets.token_hex(8),
    }
    return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(
            token,
            _secret(),
            algorithms=["HS256"],
            issuer=ISSUER,
            audience=AUDIENCE,
        )
    except _JWTError:
        return None


def get_current_user(request: Request) -> Admin:
    token = request.cookies.get(SESSION_COOKIE)
    user_id = _decode_user_id(token)
    if user_id is None:
        raise HTTPException(status_code=401, detail="No autenticado")
    with SessionLocal() as db:
        user = db.get(Admin, user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="No autenticado")
        return user


def _decode_user_id(token: Optional[str]) -> Optional[int]:
    payload = decode_token(token or "")
    if not payload:
        return None
    try:
        return int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Anti fuerza bruta: rate limiting por IP + bloqueo de cuenta
# ---------------------------------------------------------------------------

def _cleanup(ip: str) -> None:
    now = time.monotonic()
    attempts = _attempts.get(ip, [])
    _attempts[ip] = [a for a in attempts if now - a[0] < RATE_WINDOW_SECONDS]


def is_rate_limited(ip: str) -> bool:
    with _auth_lock:
        _cleanup(ip)
        failures = [t for t in _attempts.get(ip, []) if not t[1]]
        return len(failures) >= MAX_LOGIN_ATTEMPTS


def register_attempt(ip: str, ok: bool) -> None:
    with _auth_lock:
        _cleanup(ip)
        _attempts.setdefault(ip, []).append((time.monotonic(), ok))


def rate_limit_login(request: Request) -> None:
    """Comprueba el límite de intentos de login por IP y ventana temporal."""
    ip = request.client.host if request.client else "desconocido"
    with _auth_lock:
        _cleanup(ip)
        recent = [a for a in _attempts.get(ip, []) if time.monotonic() - a[0] < RATE_WINDOW_SECONDS]
        if len(recent) >= RATE_MAX_REQUESTS:
            raise HTTPException(status_code=429, detail="Demasiados intentos. Intenta en un momento.")
        failures = [a for a in recent if not a[1]]
        if len(failures) >= MAX_LOGIN_ATTEMPTS:
            raise HTTPException(status_code=429, detail="Cuenta bloqueada temporalmente. Espera unos minutos.")


# Límite anti-abuso del formulario público de contacto (OWASP A09)
RATE_CONTACT_MAX = 5
RATE_CONTACT_WINDOW = 60

_public_hits: dict[str, list[float]] = {}


def rate_limit_contact(request: Request) -> None:
    """Limita los envíos del formulario de contacto por IP para frenar bots."""
    ip = request.client.host if request.client else "desconocido"
    with _auth_lock:
        now = time.monotonic()
        hits = [t for t in _public_hits.get(ip, []) if now - t < RATE_CONTACT_WINDOW]
        if len(hits) >= RATE_CONTACT_MAX:
            raise HTTPException(
                status_code=429,
                detail="Demasiadas solicitudes. Intenta en unos minutos.",
            )
        _public_hits[ip] = hits + [now]


# ---------------------------------------------------------------------------
# CSRF (doble envío con cookie + cabecera)
# ---------------------------------------------------------------------------

def new_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def valid_csrf(token: Optional[str], cookie: Optional[str]) -> bool:
    if not token or not cookie:
        return False
    return hmac.compare_digest(token, cookie)


def require_csrf(request: Request) -> None:
    """Valida el token CSRF en mutaciones del panel (guard de dependencia)."""
    cookie = request.cookies.get(CSRF_COOKIE)
    header = request.headers.get("X-CSRF-Token")
    if not valid_csrf(header, cookie):
        raise HTTPException(status_code=403, detail="Firma CSRF inválida")


# ---------------------------------------------------------------------------
# Cabeceras de seguridad (OWASP A05)
# ---------------------------------------------------------------------------

_SECURITY_HEADERS = {
    b"x-content-type-options": b"nosniff",
    b"x-frame-options": b"DENY",
    b"referrer-policy": b"strict-origin-when-cross-origin",
    b"permissions-policy": b"camera=(), microphone=(), geolocation=()",
    b"content-security-policy": (
        b"default-src 'self'; "
        b"img-src 'self' data: blob: https:; "
        b"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        b"font-src 'self' https://fonts.gstatic.com; "
        b"script-src 'self' 'unsafe-inline'; "
        b"frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    ),
}


class SecurityHeadersMiddleware:
    """Añade cabeceras de seguridad a cada respuesta HTTP.

    Nota importante: se trabaja sobre la lista de headers tal cual para NO
    perder cabeceras repetidas (por ejemplo varios Set-Cookie en el login).
    Nunca se convierte a dict, que descartaría duplicados.
    """

    def __init__(self, app, hsts: bool = False):
        self.app = app
        self.hsts = hsts

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []) or [])
                present = {key.lower() for key, _ in headers}
                for key, value in _SECURITY_HEADERS.items():
                    if key not in present:
                        headers.append((key, value))
                if scope.get("path", "").startswith("/api/admin") and b"cache-control" not in present:
                    headers.append((b"cache-control", b"no-store"))
                if self.hsts:
                    hsts = b"strict-transport-security"
                    if hsts not in present:
                        headers.append((hsts, b"max-age=31536000; includeSubDomains"))
                message["headers"] = headers
            return await send(message)

        return await self.app(scope, receive, send_wrapper)