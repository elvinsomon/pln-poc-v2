# Frontend — Triaje de Tickets (React + Vite)

UI de la PoC, recreada desde el handoff de Claude Design. Tres vistas: **Resumen**
(dashboard), **Bandeja** (tabla + drawer de detalle) y **Registrar** (clasifica con el modelo
real al guardar). Consume el API FastAPI de `../backend`.

## Requisitos
- Node 18+ y el backend corriendo en `http://127.0.0.1:8000`.

## Arranque
```bash
# 1) Backend (desde pln-poc-v2/, con el venv que tenga torch+transformers)
../.venv/bin/uvicorn backend.main:app --reload     # o: uvicorn backend.main:app --reload
# 2) (opcional) sembrar datos demo, una sola vez
../.venv/bin/python -m backend.seed_demo
# 3) Frontend
npm install
npm run dev            # http://localhost:5173
```

El origen `http://localhost:5173` ya está permitido por el CORS del backend. La URL del API se
configura en `.env` (`VITE_API_BASE`, por defecto `http://127.0.0.1:8000`).

## Estructura
- `src/api.js` — cliente del backend (`getHealth`, `listTickets`, `createTicket`) + constantes.
- `src/components.jsx` — iconos SVG, badges, medidor de confianza, formateadores de fecha.
- `src/views/` — `Dashboard.jsx`, `Inbox.jsx`, `Register.jsx`.
- `src/index.css` — estilos portados del prototipo (fuente Space Grotesk, acento indigo).
