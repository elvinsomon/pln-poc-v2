"""Configuración del backend (con override por variable de entorno).

Ejecutar uvicorn desde la raíz del proyecto (`pln-poc-v2/`) para que el paquete
`common` y las rutas relativas resuelvan:
    uvicorn backend.main:app --reload
"""
from __future__ import annotations

import os
from pathlib import Path

# Raíz del proyecto = .../pln-poc-v2 (este archivo está en backend/).
PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"


class Settings:
    # Registro de artefactos versionados (contiene active.json + <name_date_v>/).
    ARTIFACTS_DIR: Path = Path(os.environ.get("ARTIFACTS_DIR", BACKEND_DIR / "artifacts"))

    # SQLite por defecto en backend/app.db.
    DB_URL: str = os.environ.get("DB_URL", f"sqlite:///{BACKEND_DIR / 'app.db'}")

    # Orígenes CORS permitidos (dev server del futuro frontend React).
    CORS_ORIGINS: list[str] = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    ).split(",")


settings = Settings()
