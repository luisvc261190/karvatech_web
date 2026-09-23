"""API de KARVATECH.

Combina el sitio público (contacto y proyectos) con el panel administrativo.
La aplicación sigue las buenas prácticas de FastAPI: dependencias para
autenticación/CSRF, modelos Pydantic para validar entrada (OWASP A03) y un
único punto de montaje para las rutas protegidas.
"""
from __future__ import annotations

import logging
import os
import smtplib
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func

import db as database
import mailer
import security
from db import (
    Admin,
    Message,
    Project,
    SessionLocal,
    UPLOADS_DIR,
    clean_tags,
    init_db,
    slugify,
    to_message_row,
    to_project_row,
)

# ---------------------------------------------------------------------------
# Arranque / rutas estáticas
# ---------------------------------------------------------------------------

app = FastAPI(
    title="KARVATECH API",
    description="Sitio web + panel administrativo de KARVATECH",
    version="2.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    redoc_url=None,
)

ALLOWED_ORIGINS = os.getenv("KARVATECH_ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
    expose_headers=["X-CSRF-Token"],
)
app.add_middleware(security.SecurityHeadersMiddleware, hsts=os.getenv("KARVATECH_HSTS") == "1")

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=database.STATIC_DIR), name="static")

_logger = logging.getLogger("karvatech.api")


@app.on_event("startup")
def on_startup() -> None:
    security.setup()
    init_db()


# ---------------------------------------------------------------------------
# Esquemas de entrada (validación Pydantic -> OWASP A03)
# ---------------------------------------------------------------------------

class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    lastName: str = Field(default="", max_length=120)
    email: EmailStr
    company: str = Field(default="", max_length=120)
    position: str = Field(default="", max_length=120)
    phone: str = Field(default="", max_length=40)
    sector: str = Field(default="", max_length=120)
    employees: str = Field(default="", max_length=120)
    country: str = Field(default="", max_length=120)
    pain: str = Field(min_length=5, max_length=4000)
    # Honeypot anti-bots: campo oculto que un bot rellena y un humano no ve.
    website: str = Field(default="", max_length=200)


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=6, max_length=256, description="Validación: min 6 caracteres")


class ChangePasswordIn(BaseModel):
    currentPassword: str = Field(min_length=6, max_length=256)
    newPassword: str = Field(min_length=8, max_length=256)


class MessagePatch(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(nuevo|contactado|cerrado)$")
    replyBody: Optional[str] = Field(default=None, max_length=4000)
    adminNotes: Optional[str] = Field(default=None, max_length=4000)


class ReplyIn(BaseModel):
    replyBody: str = Field(min_length=1, max_length=4000)


class ProjectIn(BaseModel):
    title: str = Field(min_length=2, max_length=140)
    subtitle: str = Field(default="", max_length=160)
    category: str = Field(min_length=2, max_length=60)
    client: str = Field(default="", max_length=140)
    industry: str = Field(default="", max_length=80)
    summary: str = Field(default="", max_length=600)
    description: str = Field(default="", max_length=8000)
    quote: str = Field(default="", max_length=400)
    authorName: str = Field(default="", max_length=120)
    authorRole: str = Field(default="", max_length=120)
    imageUrl: str = Field(default="", max_length=300)
    accent: str = Field(default="#16a34a", max_length=16, pattern="^#[0-9a-fA-F]{6}$")
    year: str = Field(default="", max_length=8)
    tags: list[str] = Field(default_factory=list, max_length=8)
    status: str = Field(default="publicado", pattern="^(borrador|publicado|en_curso|entregado)$")
    featured: bool = False
    sortOrder: int = 0


# ---------------------------------------------------------------------------
# Sitio público
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "karvatech-backend"}


@app.get("/api/health/live", response_class=PlainTextResponse)
def health_live() -> str:
    return "ok"


@app.post("/api/contact", status_code=201)
def create_contact(payload: ContactIn, request: Request) -> dict:
    security.rate_limit_contact(request)
    # Honeypot: si se rellenó, es un bot -> misma respuesta amable, sin guardar.
    if payload.website:
        _logger.info("Contacto descartado por honeypot desde %s", request.client.host)
        return {"status": "success", "message": "Solicitud recibida, te contactaremos pronto."}

    with SessionLocal() as db:
        db.add(
            Message(
                name=payload.name.strip(),
                last_name=payload.lastName.strip(),
                email=payload.email,
                phone=payload.phone.strip(),
                company=payload.company.strip(),
                position=payload.position.strip(),
                sector=payload.sector.strip(),
                employees=payload.employees.strip(),
                country=payload.country.strip(),
                pain=payload.pain.strip(),
            )
        )
        db.commit()
    _logger.info("Nuevo contacto recibido: %s <%s>", payload.name, payload.email)
    return {"status": "success", "message": "Solicitud recibida, te contactaremos pronto."}


@app.get("/api/projects")
def list_public_projects(
    limit: Optional[int] = Query(default=None, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> dict:
    with SessionLocal() as db:
        q = (
            db.query(Project)
            .filter(Project.status != "borrador")
            .order_by(Project.featured.desc(), Project.sort_order.asc(), Project.id.desc())
        )
        total = q.count()
        if limit is not None:
            q = q.offset(offset).limit(limit)
        return {
            "items": [to_project_row(r) for r in q.all()],
            "total": total,
        }


# ---------------------------------------------------------------------------
# Autenticación del panel (OWASP A07 / A08)
# ---------------------------------------------------------------------------

def _set_session_cookie(request: Request, response: JSONResponse, user: object) -> None:
    token = security.create_token(user.id)
    secure = request.url.scheme == "https"
    response.set_cookie(
        key=security.SESSION_COOKIE,
        value=token,
        max_age=security.SESSION_TTL_MINUTES * 60,
        httponly=True,
        secure=secure,
        samesite="strict",
        path="/",
    )
    response.set_cookie(
        key=security.CSRF_COOKIE,
        value=security.new_csrf_token(),
        max_age=security.SESSION_TTL_MINUTES * 60,
        httponly=False,
        secure=secure,
        samesite="strict",
        path="/",
    )


def _admin_payload(admin: Admin) -> dict:
    return {
        "id": admin.id,
        "username": admin.username,
        "name": (admin.display_name or "").strip() or admin.username,
    }


@app.post("/api/admin/login")
def admin_login(payload: LoginIn, request: Request) -> JSONResponse:
    ip = request.client.host if request.client else "desconocido"
    security.rate_limit_login(request)

    with SessionLocal() as db:
        user = db.query(Admin).filter_by(username=payload.username.strip()).first()

    if user is None or not user.is_active or not security.verify_password(payload.password, user.password_hash):
        security.register_attempt(ip, ok=False)
        _logger.warning("Login fallido usuario=%s ip=%s", payload.username, ip)
        # Respuesta genérica: no revelar si el usuario existe (A07)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    security.register_attempt(ip, ok=True)
    _logger.info("Login exitoso usuario=%s ip=%s", user.username, ip)
    response = JSONResponse({"user": _admin_payload(user)})
    _set_session_cookie(request, response, user)
    return response


@app.post("/api/admin/logout", dependencies=[Depends(security.require_csrf)])
def admin_logout(request: Request) -> JSONResponse:
    response = JSONResponse({"status": "ok"})
    response.delete_cookie(security.SESSION_COOKIE, path="/")
    response.delete_cookie(security.CSRF_COOKIE, path="/")
    return response


@app.get("/api/admin/me")
def admin_me(user: Admin = Depends(security.get_current_user)) -> dict:
    return {"user": _admin_payload(user)}


@app.get("/api/admin/summary", dependencies=[Depends(security.get_current_user)])
def admin_summary() -> dict:
    """Resumen ejecutivo del panel: métricas, destacados y últimos mensajes."""
    with SessionLocal() as db:
        projects_total = db.query(Project).count()
        projects_portfolio = db.query(Project).filter(Project.status != "borrador").count()

        status_counts: dict[str, int] = {"nuevo": 0, "contactado": 0, "cerrado": 0}
        for status, amount in (
            db.query(Message.status, func.count(Message.id)).group_by(Message.status).all()
        ):
            if status in status_counts:
                status_counts[status] = amount
        messages_replied = db.query(Message).filter(Message.reply_sent_at.isnot(None)).count()

        featured = (
            db.query(Project)
            .filter(Project.featured.is_(True), Project.status != "borrador")
            .order_by(Project.sort_order.asc(), Project.id.desc())
            .limit(6)
            .all()
        )
        recent = (
            db.query(Message)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(6)
            .all()
        )
        return {
            "projectsTotal": projects_total,
            "projectsPortfolio": projects_portfolio,
            "messagesNew": status_counts["nuevo"],
            "messagesReplied": messages_replied,
            "featured": [to_project_row(p) for p in featured],
            "recent": [to_message_row(m) for m in recent],
        }


@app.get("/api/admin/csrf")
def admin_csrf(request: Request, user: Admin = Depends(security.get_current_user)) -> JSONResponse:
    response = JSONResponse({"status": "ok"})
    response.set_cookie(
        key=security.CSRF_COOKIE,
        value=security.new_csrf_token(),
        max_age=security.SESSION_TTL_MINUTES * 60,
        httponly=False,
        secure=request.url.scheme == "https",
        samesite="strict",
        path="/",
    )
    return response


@app.post("/api/admin/change-password", dependencies=[Depends(security.require_csrf)])
def change_password(
    payload: ChangePasswordIn,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    """Permite al administrador rotar su contraseña (OWASP A07).

    Exige la clave actual, valida la nueva y cierra la sesión en el panel para
    volver a entrar con las nuevas credenciales.
    """
    if not security.verify_password(payload.currentPassword, user.password_hash):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    if payload.newPassword == payload.currentPassword:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe ser distinta a la actual")

    with SessionLocal() as db:
        admin = db.get(Admin, user.id)
        admin.password_hash = security.hash_password(payload.newPassword)
        db.commit()

    _logger.info("Contraseña actualizada de la cuenta %s", user.username)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Mensajes del formulario de contacto (panel)
# ---------------------------------------------------------------------------

@app.get("/api/admin/messages", dependencies=[Depends(security.get_current_user)])
def list_messages(
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    status: Optional[str] = Query(default=None, pattern="^(nuevo|contactado|cerrado)$"),
) -> dict:
    with SessionLocal() as db:
        q = db.query(Message)
        if status:
            q = q.filter(Message.status == status)
        total = q.count()
        rows = (
            q.order_by(Message.created_at.desc(), Message.id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        counts = {"nuevo": 0, "contactado": 0, "cerrado": 0}
        for value, amount in (
            db.query(Message.status, func.count(Message.id)).group_by(Message.status).all()
        ):
            if value in counts:
                counts[value] = amount
        return {
            "items": [to_message_row(r) for r in rows],
            "total": total,
            "offset": offset,
            "limit": limit,
            "counts": counts,
        }


@app.patch(
    "/api/admin/messages/{message_id}",
    dependencies=[Depends(security.require_csrf)],
)
def patch_message(
    message_id: int,
    payload: MessagePatch,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    with SessionLocal() as db:
        row = db.get(Message, message_id)
        if not row:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        if payload.status is not None:
            row.status = payload.status
        if payload.replyBody is not None:
            row.reply_body = payload.replyBody.strip()
            # Marcar la fecha de "respuesta enviada" solo al guardar un texto
            row.reply_sent_at = datetime.now(timezone.utc) if payload.replyBody.strip() else None
        if payload.adminNotes is not None:
            row.admin_notes = payload.adminNotes.strip()
        db.commit()
        _logger.info("Mensaje %s actualizado por %s", message_id, user.username)
        return to_message_row(row)


@app.delete(
    "/api/admin/messages/{message_id}",
    dependencies=[Depends(security.require_csrf)],
)
def delete_message(
    message_id: int,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    with SessionLocal() as db:
        row = db.get(Message, message_id)
        if not row:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        db.delete(row)
        db.commit()
    _logger.info("Mensaje %s eliminado por %s", message_id, user.username)
    return {"status": "ok", "id": message_id}


@app.post(
    "/api/admin/messages/{message_id}/reply",
    dependencies=[Depends(security.require_csrf)],
)
def send_message_reply(
    message_id: int,
    payload: ReplyIn,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    """Guarda la respuesta y la envía al cliente por email.

    Si SMTP no está configurado en el servidor, responde 503 y el panel usa el
    enlace mailto como alternativa.
    """
    with SessionLocal() as db:
        row = db.get(Message, message_id)
        if not row:
            raise HTTPException(status_code=404, detail="Mensaje no encontrado")

        if not row.email:
            raise HTTPException(status_code=400, detail="El mensaje no tiene email de contacto")

        body = payload.replyBody.strip()
        if not body:
            raise HTTPException(status_code=400, detail="Escribe una respuesta antes de enviar")

        full_name = " ".join(x for x in (row.name, row.last_name) if x).strip() or "Cliente"
        subject = "Respuesta de KARVATECH"
        email_body = mailer.build_reply_body(body, row.name or "Cliente")

        try:
            mailer.send_email(row.email, full_name, subject, email_body)
        except RuntimeError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"{exc} Usa el enlace 'Abrir en tu correo' mientras tanto.",
            )
        except (smtplib.SMTPException, OSError) as exc:
            _logger.error("Fallo al enviar respuesta a %s: %s", row.email, exc)
            raise HTTPException(
                status_code=502,
                detail="El servidor de correo rechazó el envío. Revisa la configuración SMTP.",
            )

        row.reply_body = body
        row.reply_sent_at = datetime.now(timezone.utc)
        if row.status == "nuevo":
            row.status = "contactado"
        db.commit()
        _logger.info("Respuesta enviada y guardada para mensaje %s -> %s", message_id, row.email)
        return to_message_row(row)


# ---------------------------------------------------------------------------
# Proyectos (panel)
# ---------------------------------------------------------------------------

@app.get("/api/admin/projects", dependencies=[Depends(security.get_current_user)])
def list_admin_projects(
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict:
    with SessionLocal() as db:
        q = db.query(Project).order_by(Project.sort_order.asc(), Project.updated_at.desc())
        total = q.count()
        rows = q.offset(offset).limit(limit).all()
        return {"items": [to_project_row(r) for r in rows], "total": total}


@app.post("/api/admin/projects", dependencies=[Depends(security.require_csrf)])
def create_project(
    payload: ProjectIn,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    with SessionLocal() as db:
        row = Project(
            slug=slugify(payload.title),
            title=payload.title.strip(),
            subtitle=payload.subtitle.strip(),
            category=payload.category.strip(),
            client=payload.client.strip(),
            industry=payload.industry.strip(),
            summary=payload.summary.strip(),
            description=payload.description.strip(),
            quote=payload.quote.strip(),
            author_name=payload.authorName.strip(),
            author_role=payload.authorRole.strip(),
            image_url=payload.imageUrl.strip(),
            accent=payload.accent,
            year=payload.year.strip(),
            tags=clean_tags(payload.tags),
            status=payload.status,
            featured=payload.featured,
            sort_order=payload.sortOrder,
        )
        db.add(row)
        db.commit()
        _logger.info("Proyecto %s creado por %s", row.title, user.username)
        return to_project_row(row)


@app.patch(
    "/api/admin/projects/{project_id}",
    dependencies=[Depends(security.require_csrf)],
)
def patch_project(
    project_id: int,
    payload: ProjectIn,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    with SessionLocal() as db:
        row = db.get(Project, project_id)
        if not row:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        row.slug = slugify(payload.title)
        row.title = payload.title.strip()
        row.subtitle = payload.subtitle.strip()
        row.category = payload.category.strip()
        row.client = payload.client.strip()
        row.industry = payload.industry.strip()
        row.summary = payload.summary.strip()
        row.description = payload.description.strip()
        row.quote = payload.quote.strip()
        row.author_name = payload.authorName.strip()
        row.author_role = payload.authorRole.strip()
        row.image_url = payload.imageUrl.strip()
        row.accent = payload.accent
        row.year = payload.year.strip()
        row.tags = clean_tags(payload.tags)
        row.status = payload.status
        row.featured = payload.featured
        row.sort_order = payload.sortOrder
        row.updated_at = datetime.now(timezone.utc)
        db.commit()
        _logger.info("Proyecto %s actualizado por %s", row.id, user.username)
        return to_project_row(row)


@app.delete(
    "/api/admin/projects/{project_id}",
    dependencies=[Depends(security.require_csrf)],
)
def delete_project(
    project_id: int,
    user: Admin = Depends(security.get_current_user),
) -> dict:
    with SessionLocal() as db:
        row = db.get(Project, project_id)
        if not row:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        db.delete(row)
        db.commit()
    _logger.info("Proyecto %s eliminado por %s", project_id, user.username)
    return {"status": "ok", "id": project_id}


# ---------------------------------------------------------------------------
# Subida de imágenes de proyectos (OWASP A04: validación de contenidos)
# ---------------------------------------------------------------------------

_MAX_UPLOAD = 4 * 1024 * 1024
_ALLOWED_MIME = {
    "image/jpeg": (".jpg", b"\xff\xd8\xff"),
    "image/png": (".png", b"\x89PNG\r\n\x1a\n"),
    "image/webp": (".webp", b"RIFF"),
    "image/gif": (".gif", b"GIF8"),
}

_DANGEROUS_EXTENSIONS = {".svg", ".html", ".htm", ".php", ".exe", ".js"}


@app.post(
    "/api/admin/upload",
    dependencies=[Depends(security.require_csrf), Depends(security.get_current_user)],
)
async def upload_image(request: Request, file: UploadFile = File(...)) -> dict:
    content = await file.read(_MAX_UPLOAD + 1)
    if len(content) > _MAX_UPLOAD:
        raise HTTPException(status_code=413, detail="El archivo supera el límite de 4 MB")

    ext = Path(file.filename or "").suffix.lower()
    if ext in _DANGEROUS_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Tipo de archivo no permitido")

    mime = file.content_type or ""
    if mime not in _ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="Solo se admiten imágenes JPG, PNG, WEBP o GIF")

    expected_ext, magic = _ALLOWED_MIME[mime]
    if not content.startswith(magic):
        raise HTTPException(status_code=415, detail="El contenido del archivo no coincide con su tipo")

    name = f"proy_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{os.urandom(3).hex()}{expected_ext}"
    (UPLOADS_DIR / name).write_bytes(content)
    _logger.info("Imagen subida: %s (%d bytes)", name, len(content))
    return {"url": f"/static/uploads/{name}"}