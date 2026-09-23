"""Capa de persistencia de KARVATECH (PostgreSQL en Neon Cloud).

Usa SQLAlchemy ORM con parámetros vinculados en todas las consultas para
prevenir inyección SQL (OWASP A03). Los modelos reflejan las tablas ya creadas
en Neon (messages, projects); la única tabla nueva es "admins" (login del panel)
y se crea con CREATE TABLE IF NOT EXISTS sin tocar las existentes.

La config de conexión vive en backend/.env (ignorado por git): DATABASE_URL.
"""
from __future__ import annotations

import logging
import os
import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, create_engine, text as sa_text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
MESSAGES_DIR = BASE_DIR / "messages"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = STATIC_DIR / "uploads"
LOGS_DIR = BASE_DIR / "logs"

load_dotenv(BASE_DIR / ".env")

DATE_FACTORY = lambda: datetime.now(timezone.utc)  # noqa: E731


def database_url() -> str:
    """Normaliza la cadena de conexión de Neon para SQLAlchemy + psycopg2.

    - Convierte postgres:// -> postgresql+psycopg2://
    - Quita channel_binding=require porque el pooler de Neon no lo soporta
      y rompería la conexión; sslmode=require se conserva.
    """
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "Falta DATABASE_URL. Crea backend/.env siguiendo el modelo backend/.env.example."
        )
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            url = url[len(prefix):]
            break
    base, _, query = url.partition("?")
    params = [p for p in query.split("&") if p and not p.startswith("channel_binding=")]
    return f"postgresql+psycopg2://{base}" + (f"?{'&'.join(params)}" if params else "")


engine = create_engine(database_url(), pool_pre_ping=True, pool_recycle=1800)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Admin(Base):
    """Cuenta del panel administrativo (tabla propia, no altera las existentes)."""

    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    username = Column(String(64), unique=True, nullable=False)
    display_name = Column(String(120), nullable=False, default="")
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=DATE_FACTORY)


class Message(Base):
    """Corresponde a la tabla pública "messages" de Neon."""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    last_name = Column(String, nullable=False, default="")
    email = Column(String, nullable=False)
    company = Column(String, nullable=False, default="")
    position = Column(String, nullable=False, default="")
    phone = Column(String, nullable=False, default="")
    sector = Column(String, nullable=False, default="")
    employees = Column(String, nullable=False, default="")
    country = Column(String, nullable=False, default="")
    pain = Column(Text, nullable=False, default="")
    status = Column(String, nullable=False, default="nuevo")
    reply_body = Column(Text, nullable=False, default="")
    reply_sent_at = Column(DateTime(timezone=True), nullable=True)
    admin_notes = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, default=DATE_FACTORY)


class Project(Base):
    """Corresponde a la tabla pública "projects" de Neon."""

    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    slug = Column(String, nullable=False)
    title = Column(String, nullable=False)
    subtitle = Column(String, nullable=False, default="")
    category = Column(String, nullable=False, default="")
    client = Column(String, nullable=False, default="")
    industry = Column(String, nullable=False, default="")
    summary = Column(Text, nullable=False, default="")
    description = Column(Text, nullable=False, default="")
    quote = Column(Text, nullable=False, default="")
    author_name = Column(String, nullable=False, default="")
    author_role = Column(String, nullable=False, default="")
    image_url = Column(String, nullable=False, default="")
    accent = Column(String, nullable=False, default="#16a34a")
    year = Column(String, nullable=False, default="")
    tags = Column(ARRAY(Text), nullable=False, default=list)
    status = Column(String, nullable=False, default="borrador")
    featured = Column(Boolean, nullable=False, default=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, default=DATE_FACTORY)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=DATE_FACTORY, onupdate=DATE_FACTORY)


def init_db() -> None:
    _create_admins_table()
    _ensure_admin_name_column()
    _seed_admin()
    _ensure_indexes()
    _seed_projects()
    _migrate_legacy_messages()


def _create_admins_table() -> None:
    with engine.begin() as conn:
        conn.execute(
            sa_text(
                """
                CREATE TABLE IF NOT EXISTS admins (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(64) UNIQUE NOT NULL,
                    display_name VARCHAR(120) NOT NULL DEFAULT '',
                    password_hash VARCHAR(255) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
        )


def _ensure_admin_name_column() -> None:
    """Añade display_name a tablas admins creadas antes de existir la columna.

    Es idempotente (ADD COLUMN IF NOT EXISTS). Después rellena la cuenta activa
    con el nombre de KARVATECH_ADMIN_NAME o, en su defecto, el nombre de usuario,
    para que el panel siempre tenga un nombre legible.
    """
    with engine.begin() as conn:
        conn.execute(
            sa_text(
                "ALTER TABLE admins ADD COLUMN IF NOT EXISTS "
                "display_name VARCHAR(120) NOT NULL DEFAULT ''"
            )
        )

    display = os.getenv("KARVATECH_ADMIN_NAME", "").strip()
    with SessionLocal() as db:
        row = db.query(Admin).filter_by(is_active=True).order_by(Admin.id).first()
        if row and not (row.display_name or "").strip():
            row.display_name = display or row.username
            db.commit()


# ---------------------------------------------------------------------------
# Usuario administrador inicial
# ---------------------------------------------------------------------------

def _seed_admin() -> None:
    """Crea la cuenta administradora la primera vez con una clave segura.

    La clave sale de KARVATECH_ADMIN_PASSWORD; si no está definida se genera
    aleatoriamente y se guarda en credentials.txt (ignorado por git). Nunca se
    usa una clave por defecto predecible (OWASP A07).
    """
    from security import hash_password

    with SessionLocal() as db:
        if db.query(Admin).filter_by(is_active=True).first():
            return

        username = os.getenv("KARVATECH_ADMIN_USER", "admin")
        display = os.getenv("KARVATECH_ADMIN_NAME", "").strip() or username
        password = os.getenv("KARVATECH_ADMIN_PASSWORD", "")
        generated = False
        if not password:
            password = secrets.token_urlsafe(16)
            generated = True

        db.add(Admin(username=username, display_name=display, password_hash=hash_password(password)))
        db.commit()

        creds = BASE_DIR / "credentials.txt"
        creds.write_text(
            f"KARVATECH ADMIN\n==============\nUsuario: {username}\nClave:   {password}\n"
            f"Cambia esta clave si fue generada automáticamente.\n",
            encoding="utf-8",
        )

        line = "=" * 58
        logging.getLogger("karvatech.bootstrap").warning(
            "\n%s\n  Cuenta administradora creada con clave %s.\n  Credenciales guardadas en %s\n%s",
            line,
            "generada aleatoriamente" if generated else "definida en KARVATECH_ADMIN_PASSWORD",
            creds,
            line,
        )


# ---------------------------------------------------------------------------
# Índices para consultas habituales con miles de filas (escalabilidad)
# ---------------------------------------------------------------------------

def _ensure_indexes() -> None:
    """Crea índices que faltan sin tocar las tablas (idempotente y seguro)."""
    statements = [
        "CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC, id DESC)",
        "CREATE INDEX IF NOT EXISTS idx_messages_status ON messages (status)",
        "CREATE INDEX IF NOT EXISTS idx_projects_sort ON projects (sort_order, updated_at)",
        "CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status)",
    ]
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(sa_text(statement))


# ---------------------------------------------------------------------------
# Proyectos demo (solo si la tabla está vacía) para que la web luzca completa
# ---------------------------------------------------------------------------

_DEMO_PROJECTS = [
    {
        "slug": "crm-nova-retail",
        "title": "CRM NOVA Retail",
        "subtitle": "Ventas y seguimiento comercial unificados",
        "category": "CRM a medida",
        "client": "NOVA Retail",
        "industry": "Retail",
        "summary": "Centralizamos ventas y seguimiento comercial en un CRM a medida.",
        "description": (
            "Centralizamos ventas y seguimiento comercial en un CRM a medida. "
            "Los asesores redujeron a la mitad el tiempo en reportes y duplicaron "
            "el cierre de negocios con tableros en tiempo real."
        ),
        "quote": "Pasamos de planillas de Excel a decisiones en tiempo real.",
        "author_name": "María Cárdenas",
        "author_role": "Gerente General, NOVA Retail",
        "image_url": "/images/art-work.jpg",
        "accent": "#16a34a",
        "year": "2024",
        "tags": ["React", "Python", "Postgres"],
        "status": "publicado",
        "featured": True,
        "sort_order": 1,
    },
    {
        "slug": "erp-avilog",
        "title": "ERP AviLog",
        "subtitle": "Logística e inventario en tiempo real",
        "category": "ERP · Logística",
        "client": "AviLog",
        "industry": "Logística",
        "summary": "ERP de inventario, finanzas y despachos que reemplazó las planillas de Excel.",
        "description": (
            "ERP de inventario, finanzas y despachos que reemplazó las planillas "
            "de Excel por decisiones en tiempo real en toda la cadena logística "
            "del operador."
        ),
        "quote": "La operación completa hoy se maneja desde una sola pantalla.",
        "author_name": "Jorge Ramos",
        "author_role": "Director de Operaciones, AviLog",
        "image_url": "/images/art-software.jpg",
        "accent": "#f59e0b",
        "year": "2024",
        "tags": ["React", "FastAPI", "Postgres"],
        "status": "publicado",
        "featured": True,
        "sort_order": 2,
    },
    {
        "slug": "app-medlive",
        "title": "App MedLive",
        "subtitle": "Citas y telemedicina en el bolsillo del paciente",
        "category": "App móvil · Salud",
        "client": "MedLive",
        "industry": "Salud",
        "summary": "Aplicación móvil de citas y telemedicina que conecta pacientes con especialistas.",
        "description": (
            "Aplicación móvil de citas y telemedicina que conecta pacientes con "
            "especialistas, con recordatorios inteligentes y videollamadas integradas."
        ),
        "quote": "El 70% de las citas hoy se autogestiona desde el celular.",
        "author_name": "Dra. Lucía Torres",
        "author_role": "Directora Médica, MedLive",
        "image_url": "/images/art-how.jpg",
        "accent": "#2563eb",
        "year": "2023",
        "tags": ["React Native", "IA"],
        "status": "publicado",
        "featured": False,
        "sort_order": 3,
    },
    {
        "slug": "plataforma-eduplus",
        "title": "Plataforma EduPlus",
        "subtitle": "Gestión académica para toda la comunidad",
        "category": "Plataforma web · Educación",
        "client": "EduPlus",
        "industry": "Educación",
        "summary": "Matrícula, notas, pagos y comunicación con familias en un solo lugar.",
        "description": (
            "Plataforma web para gestión académica: matrícula, notas, pagos y "
            "comunicación con las familias en un solo lugar, con roles para "
            "alumnos, docentes y padres."
        ),
        "quote": "La comunicación con los padres fue lo que más mejoró.",
        "author_name": "Carlos Mendoza",
        "author_role": "Director, EduPlus",
        "image_url": "/images/art-about.jpg",
        "accent": "#7c3aed",
        "year": "2023",
        "tags": ["Next.js", "IA"],
        "status": "publicado",
        "featured": False,
        "sort_order": 4,
    },
    {
        "slug": "agente-ia-credandes",
        "title": "Agente IA CrediAndes",
        "subtitle": "Atención 24/7 con inteligencia artificial",
        "category": "Inteligencia artificial",
        "client": "CrediAndes",
        "industry": "Finanzas",
        "summary": "Asistente de IA que clasifica solicitudes y evalúa riesgo crediticio.",
        "description": (
            "Asistente de IA que clasifica solicitudes, responde clientes 24/7 y "
            "automatiza la evaluación preliminar de riesgo crediticio, liberando "
            "al equipo de análisis de tareas repetitivas."
        ),
        "quote": "El bot ya resuelve el 45% de las consultas sin intervención humana.",
        "author_name": "Ana Paredes",
        "author_role": "Jefa de Créditos, CrediAndes",
        "image_url": "/images/gifs/ai-systems.gif",
        "accent": "#0ea5e9",
        "year": "2024",
        "tags": ["Python", "LLM"],
        "status": "publicado",
        "featured": True,
        "sort_order": 5,
    },
    {
        "slug": "automatizacion-farmagroup",
        "title": "Automatización FarmaGroup",
        "subtitle": "Integración de bodega, venta y facturación",
        "category": "Automatización",
        "client": "FarmaGroup",
        "industry": "Farmacias",
        "summary": "Integramos bodega, venta y facturación para eliminar el copiado manual de datos.",
        "description": (
            "Integramos bodega, venta y facturación para eliminar el copiado "
            "manual de datos entre tres sistemas y reducir drásticamente los "
            "errores de inventario."
        ),
        "quote": "Cerramos el día con inventario exacto por primera vez.",
        "author_name": "Rosa Canales",
        "author_role": "Administradora, FarmaGroup",
        "image_url": "/images/gifs/automation.gif",
        "accent": "#dc2626",
        "year": "2025",
        "tags": ["Python", "RPA"],
        "status": "en_curso",
        "featured": False,
        "sort_order": 6,
    },
]


def _seed_projects() -> None:
    with SessionLocal() as db:
        if db.query(Project).first():
            return
        for data in _DEMO_PROJECTS:
            db.add(Project(**data))
        db.commit()


# ---------------------------------------------------------------------------
# Migración de datos del formato antiguo (archivos .txt) a la tabla messages
# ---------------------------------------------------------------------------

_LABELS = {
    "fecha": "fecha",
    "nombre": "nombre",
    "correo": "email",
    "tel": "phone",
    "empresa": "company",
    "cargo": "position",
    "sector": "sector",
    "empleados": "employees",
    "país": "country",
}


def _migrate_legacy_messages() -> None:
    """Importa los mensajes que aún existen como archivos de texto en messages/.

    Los archivos con extensión .txt se migran a la tabla messages y se renombran
    a *.txt.imported para no duplicarlos en el siguiente arranque.
    """
    files = sorted(MESSAGES_DIR.glob("*.txt"))
    if not files:
        return

    logger = logging.getLogger("karvatech.migration")
    with SessionLocal() as db:
        for path in files:
            try:
                text = path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                logger.warning("No se pudo leer %s", path)
                continue

            fields: dict[str, str] = {}
            marker = None
            for raw in text.splitlines():
                if "Principal dolor" in raw:
                    marker = raw
                    continue
                if marker is not None:
                    fields["pain"] = fields.get("pain", "") + raw + "\n"
                    continue
                if ":" in raw:
                    key, _, value = raw.partition(":")
                    key = key.strip().lower()
                    value = value.strip()
                    if key in _LABELS:
                        fields[_LABELS[key]] = value

            if not fields.get("nombre") or not fields.get("email"):
                logger.warning("Mensaje sin datos mínimos, se omite: %s", path.name)
                continue

            name_full = fields.get("nombre", "").strip() or "Sin nombre"
            db.add(
                Message(
                    name=name_full.split(" ", 1)[0],
                    last_name=name_full.split(" ", 1)[1] if " " in name_full else "",
                    email=fields.get("email", ""),
                    phone=fields.get("phone") or "",
                    company=fields.get("company") or "",
                    position=fields.get("position") or "",
                    sector=fields.get("sector") or "",
                    employees=fields.get("employees") or "",
                    country=fields.get("country") or "",
                    pain=fields.get("pain", "").strip() or "Sin descripción",
                )
            )
            db.commit()
            path.rename(path.with_suffix(".txt.imported"))
            logger.info("Migrado: %s", path.name)


# ---------------------------------------------------------------------------
# Serialización (sin exponer datos internos)
# ---------------------------------------------------------------------------

def to_message_row(message: Message) -> dict:
    return {
        "id": message.id,
        "name": message.name,
        "lastName": message.last_name or "",
        "email": message.email,
        "company": message.company or "",
        "position": message.position or "",
        "phone": message.phone or "",
        "sector": message.sector or "",
        "employees": message.employees or "",
        "country": message.country or "",
        "pain": message.pain or "",
        "status": message.status,
        "replyBody": message.reply_body or "",
        "replySentAt": message.reply_sent_at.isoformat() if message.reply_sent_at else None,
        "adminNotes": message.admin_notes or "",
        "createdAt": message.created_at.isoformat() if message.created_at else None,
    }


def to_project_row(project: Project) -> dict:
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "subtitle": project.subtitle or "",
        "category": project.category or "",
        "client": project.client or "",
        "industry": project.industry or "",
        "summary": project.summary or "",
        "description": project.description or "",
        "quote": project.quote or "",
        "authorName": project.author_name or "",
        "authorRole": project.author_role or "",
        "imageUrl": project.image_url or "",
        "accent": project.accent or "#16a34a",
        "year": project.year or "",
        "tags": list(project.tags or []),
        "status": project.status or "borrador",
        "featured": project.featured,
        "sortOrder": project.sort_order,
        "createdAt": project.created_at.isoformat() if project.created_at else None,
        "updatedAt": project.updated_at.isoformat() if project.updated_at else None,
    }


def slugify(title: str) -> str:
    value = title.lower().strip()
    value = re.sub(r"[^a-z0-9áéíóúñü]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "proyecto"


def clean_tags(tags: list[str]) -> list[str]:
    out: list[str] = []
    for tag in tags or []:
        t = re.sub(r"\s+", " ", tag).strip().rstrip(",")
        if t and t not in out:
            out.append(t)
    return out[:8]