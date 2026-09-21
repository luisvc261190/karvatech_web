from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

BASE_DIR = Path(__file__).resolve().parent
MESSAGES_DIR = BASE_DIR / "messages"
MESSAGES_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="KARVATECH API",
    description="API de contacto para la página web de KARVATECH",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    lastName: str = Field(default="", max_length=120)
    email: EmailStr
    company: str = Field(default="", max_length=120)
    position: str = Field(default="", max_length=120)
    phone: str = Field(default="", max_length=40)
    sector: str = Field(default="", max_length=120)
    employees: str = Field(default="", max_length=120)
    country: str = Field(default="", max_length=120)
    pain: str = Field(..., min_length=5, max_length=4000)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "karvatech-backend"}


@app.post("/api/contact", status_code=201)
def create_contact(payload: ContactMessage):
    filename = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f") + ".txt"
    content = (
        f"Fecha: {datetime.now(timezone.utc).isoformat()}\n"
        f"Nombre: {payload.name} {payload.lastName}\n"
        f"Correo: {payload.email}\n"
        f"Teléfono: {payload.phone or 'No indicó'}\n"
        f"Empresa: {payload.company or 'No indicó'}\n"
        f"Cargo: {payload.position or 'No indicó'}\n"
        f"Sector: {payload.sector or 'No indicó'}\n"
        f"Nº de empleados: {payload.employees or 'No indicó'}\n"
        f"País: {payload.country or 'No indicó'}\n"
        f"Principal dolor:\n{payload.pain}\n"
        f"{'-' * 50}\n"
    )
    (MESSAGES_DIR / filename).write_text(content, encoding="utf-8")
    return {"status": "success", "message": "Solicitud recibida, te contactaremos pronto."}