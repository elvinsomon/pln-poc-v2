# PoC v2 — Clasificador de tickets (notebook + API)

Evolución de `PoC-C2` a una **arquitectura cliente-servidor**. Un notebook centralizado entrena y compara los modelos y **exporta automáticamente el mejor**; un backend **FastAPI** lo sirve: clasifica tickets entrantes, deriva su prioridad y los persiste en SQLite, devolviéndolos ordenados para una vista de administrador. Un **frontend React (Vite)** consume el API con tres vistas: Resumen (dashboard), Bandeja (tabla + detalle) y Registrar.

> **TL;DR — levantar todo:** `docker compose up --build` y abre `http://localhost:8080`. Ver [Opción A](#opción-a-docker-un-comando).

Clases: `bug` / `feature` / `question` (dataset NLBSE'23).

## Estructura

```
pln-poc-v2/
├── common/              # paquete COMPARTIDO notebook+backend
│   ├── preprocessing.py # cadena anonimizar+limpiar (fuente única; evita drift)
│   └── constants.py     # clases, preprocesado por defecto, mapa de prioridad
├── data/{raw,processed} # CSV de entrada / splits parquet (gitignored)
├── notebook/
│   ├── main.ipynb       # EDA + TFIDF + BERT + comparación + auto-selección + export
│   └── requirements.txt
├── backend/
│   ├── main.py          # FastAPI (lifespan: init DB + carga modelo), CORS, /health
│   ├── config.py        # ARTIFACTS_DIR, DB_URL, CORS_ORIGINS (env-override)
│   ├── database.py      # engine/Session/Base/get_db/init_db (SQLite)
│   ├── models.py        # ORM Ticket
│   ├── schemas.py       # Pydantic
│   ├── routers/         # predict.py (POST /predict, /tickets) · history.py (GET /tickets)
│   ├── services/        # model_service.py (loader dinámico) · priority.py
│   ├── artifacts/       # registro versionado + active.json
│   ├── seed_demo.py     # siembra idempotente de tickets demo (vía el modelo real)
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/            # React + Vite (UI): src/{api.js,components.jsx,App.jsx,views/}
│   ├── Dockerfile       # build + nginx (sirve la SPA y hace proxy /api -> backend)
│   └── nginx.conf
└── docker-compose.yml   # levanta backend + frontend con un solo comando
```

## Modelo dinámico

El notebook elige por **F1-macro en test** entre TF-IDF+SVM y DistilBERT y exporta el ganador a `backend/artifacts/<name>_<date>_<version>/` con un `meta.json`. El puntero `backend/artifacts/active.json` indica cuál sirve el backend.

`meta.json` lleva el **tipo** (`sklearn`|`bert`) y la **config de preprocesado** con la que se entrenó. El backend la usa para reproducir exactamente la cadena en inferencia. Si gana BERT, el loader importa torch/transformers; si gana el SVM, no se importa torch (deploy ligero).

## Uso

### Opción A: Docker (un comando)

Requiere Docker Desktop. Con el artefacto del modelo ya presente en `backend/artifacts/` (lo produce el notebook):

```bash
docker compose up --build
```

- **UI:** `http://localhost:8080`  ·  **API + Swagger:** `http://localhost:8000/docs`
- El **primer build** descarga torch+transformers (varios minutos / ~GB). El backend **siembra 14 tickets demo** (idempotente) en el primer arranque, así el dashboard y la bandeja se ven poblados.
- La BD vive en un volumen (`backend-data`); los artefactos se **montan** read-only (no se copian a la imagen). El frontend (nginx) sirve la SPA y hace **proxy `/api` → backend** (mismo origen, sin CORS).
- Parar: `docker compose down`  ·  Resetear datos: `docker compose down -v`.

### Opción B: local (sin Docker)

**Backend** — desde la raíz del proyecto (para que `common` y las rutas resuelvan):
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt   # si el ganador es sklearn, puedes borrar torch/transformers
python -m backend.seed_demo                # opcional: sembrar datos demo (una vez)
uvicorn backend.main:app --reload
```
**Frontend** — en otra terminal:
```bash
cd frontend && npm install && npm run dev   # http://localhost:5173 (CORS ya permitido)
```

### Entrenar y exportar (notebook)

Coloca el CSV en `data/raw/dataset.csv`. En **Colab (GPU T4)** o local:
```bash
pip install -r notebook/requirements.txt
jupyter lab   # ejecutar notebook/main.ipynb de arriba a abajo
```
Produce `backend/artifacts/<artifact>/` + `meta.json` + `active.json`. Sin GPU, BERT se omite y gana el SVM.

> Si entrenaste en Colab, descarga (zip) la carpeta del artefacto + `active.json` y colócalos bajo el `backend/artifacts/` local (el artefacto BERT pesa ~270 MB).

## API

| Método | Ruta | Hace |
|---|---|---|
| GET  | `/health` | estado + versión/tipo de modelo + clases |
| POST | `/predict` | clasifica **sin** persistir (preview): `{title,body}` → `{category,priority,confidence,probabilities}` |
| POST | `/tickets` | clasifica → deriva prioridad → **persiste** → devuelve el ticket (201) |
| GET  | `/tickets` | lista ordenada por prioridad (Alta→Media→Baja) y, dentro, por fecha asc (FIFO). Filtros: `category`, `priority`, `limit` |
| GET  | `/tickets/{id}` | un ticket (404 si no existe) |

Prioridad: `bug`→Alta, `question`→Media, `feature`→Baja.

Docs interactivas en `http://localhost:8000/docs`.

## Decisiones de diseño

- **`common/` compartido** entre notebook y backend → una sola implementación del preprocesado; los valores viajan en `meta.json`, no se hardcodean.
- **Artefactos versionados + `active.json`** (en vez de un `model.pkl` plano) porque el ganador es dinámico (SVM o BERT) y permite rollback determinista.
- **`priority_rank` int** persistido → `ORDER BY` trivial e indexable; la regla vive solo en `priority.py`/`constants.py`.
- **`created_at` UTC tz-aware** (no `CURRENT_TIMESTAMP` de SQLite) para ordenar bien.

## Fuera de alcance (siguiente etapa)
Auth/roles, paginación avanzada, aging de prioridad, reentrenamiento programado.
