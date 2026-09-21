# KARVATECH — Sitio Web Corporativo

Página web profesional para KARVATECH S.A.C., empresa de desarrollo de
software a medida, CRM y ERP fundada por **Luis Alberto Valle Coronado** y
**Karla Elizabeth Albites Palomino**.

## Stack

- **Frontend:** React + Vite (`karvatech-web/`)
- **Backend:** Python + FastAPI (`backend/`)
- **Base de datos:** Mensajes de contacto guardados como archivos de texto en `backend/messages/`

## Estructura

```
KARVATECH/
├── karvatech-web/        # Frontend React (Vite)
│   └── src/
│       ├── journey.jsx   # Contexto + paneles del recorrido
│       ├── components/
│       │   ├── Track.jsx      # Scroller horizontal con scroll-snap
│       │   ├── SideRail.jsx   # Rail lateral: MENÚ / logo / Hablemos
│       │   ├── TechCanvas.jsx # Fondo animado (redes y código)
│       │   └── panels/        # Hero, Qué construimos, Escuchar,
│       │                      # Cómo trabajamos, Clientes, Nosotros, Hablemos
│       └── index.css     # Sistema de diseño editorial
├── backend/
│   ├── main.py           # API FastAPI (POST /api/contact)
│   └── messages/         # Mensajes recibidos del formulario
├── instalar-backend.bat  # Configura el entorno Python del backend
└── iniciar-backend.bat   # Arranca el servidor del backend
```

## Cómo ejecutar

### 1) Backend (primera vez)

```bat
instalar-backend.bat
```

### 2) Backend (cada vez que quieras usarlo)

```bat
iniciar-backend.bat
```

El backend se ejecuta en `http://localhost:8000`. Los mensajes del
formulario quedan guardados en `backend/messages/`.

### 3) Frontend

```powershell
cd karvatech-web
npm run dev
```

Abre `http://localhost:5173`. El proxy de Vite envía las peticiones `/api/*`
hacia el backend en el puerto 8000.

### Build de producción

```powershell
cd karvatech-web
npm run build
```

## Personalización rápida

- **Teléfono / WhatsApp:** busca `999` en `src/components/Contact.jsx`,
  `WhatsAppButton.jsx` y `Footer.jsx`, o edita `wa.me/51...`.
- **Correo:** busca `contacto@karvatech.com`.

## API

| Método | Ruta          | Descripción                      |
| ------ | ------------- | -------------------------------- |
| GET    | `/api/health` | Estado del servicio              |
| POST   | `/api/contact`| Recibe mensajes del formulario   |