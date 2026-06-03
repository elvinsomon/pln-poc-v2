"""App FastAPI: arranque (DB + modelo), CORS, routers y /health.

Ejecutar desde la raíz del proyecto:
    uvicorn backend.main:app --reload
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import backend.services.model_service as ms
from backend.config import settings
from backend.database import init_db
from backend.routers import history, predict
from backend.services.model_service import ModelService


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    ms.model_service = ModelService(settings.ARTIFACTS_DIR)
    ms.model_service.load()   # carga única (bloqueante) al arrancar
    yield


app = FastAPI(title="PLN PoC v2 — Clasificador de tickets", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)
app.include_router(history.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    svc = ms.model_service
    return {
        "status": "ok" if svc is not None else "loading",
        "model_version": getattr(svc, "version", None),
        "model_type": getattr(svc, "type", None),
        "classes": getattr(svc, "classes", None),
    }
