"""Envío de correos desde el panel (SMTP configurable por entorno).

Cuando SMTP_HOST no está definido en backend/.env, este módulo queda
deshabilitado: el panel guarda la respuesta en la base de datos y ofrece un
enlace mailto para que el administrador envíe el correo desde su propio
cliente de correo.

Configuración soportada:
    SMTP_HOST        servidor (ej. smtp.gmail.com)
    SMTP_PORT        puerto (por defecto 587)
    SMTP_USER        usuario de autenticación
    SMTP_PASSWORD    contraseña o clave de aplicación
    SMTP_FROM        dirección remitente (por defecto SMTP_USER)
    SMTP_FROM_NAME   nombre visible del remitente (por defecto KARVATECH)
    SMTP_USE_TLS     "1" para STARTTLS (por defecto activo)
    SMTP_USE_SSL     "1" para conexión SSL directa (SMTP_SSL)
"""
from __future__ import annotations

import logging
import os
import smtplib
from email.message import EmailMessage

_logger = logging.getLogger("karvatech.mailer")


def is_configured() -> bool:
    return bool(os.getenv("SMTP_HOST", "").strip())


def send_email(to_email: str, to_name: str, subject: str, body: str) -> None:
    """Envía un correo de texto plano por SMTP."""
    if not is_configured():
        raise RuntimeError("SMTP no configurado. Define SMTP_HOST en backend/.env")

    host = os.getenv("SMTP_HOST", "").strip()
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    from_addr = os.getenv("SMTP_FROM", "").strip() or user or f"noreply@{host}"
    from_name = os.getenv("SMTP_FROM_NAME", "KARVATECH").strip()
    use_ssl = os.getenv("SMTP_USE_SSL", "0") == "1"
    use_tls = not use_ssl and os.getenv("SMTP_USE_TLS", "1") == "1"

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_addr}>"
    msg["To"] = f"{to_name} <{to_email}>" if to_name else to_email
    msg.set_content(body)

    if use_ssl:
        server = smtplib.SMTP_SSL(host, port, timeout=15)
    else:
        server = smtplib.SMTP(host, port, timeout=15)
    try:
        if use_tls:
            server.starttls()
        if user:
            server.login(user, password)
        server.send_message(msg)
    finally:
        try:
            server.quit()
        except smtplib.SMTPException:
            pass

    _logger.info("Correo enviado a %s (%s)", to_email, subject)


def build_reply_body(reply: str, name: str) -> str:
    """Cuerpo del correo de respuesta con despedida de marca."""
    salute = f"Hola {name}," if name else "Hola,"
    return (
        f"{salute}\n\n"
        f"{reply}\n\n"
        f"--\n"
        f"Equipo KARVATECH\n"
        f"contacto@karvatech.com"
    )