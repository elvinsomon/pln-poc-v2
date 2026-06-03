"""SQLAlchemy: engine, sesión, Base y dependencia de FastAPI."""
from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.config import settings

# check_same_thread=False: SQLite + FastAPI atiende requests en hilos del pool.
engine = create_engine(
    settings.DB_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Dependencia FastAPI: una sesión por request, cerrada al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Crea las tablas si no existen. Importa models para registrarlos en Base."""
    import backend.models  # noqa: F401  (registra Ticket en Base.metadata)
    Base.metadata.create_all(bind=engine)
