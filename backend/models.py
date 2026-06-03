"""ORM: tabla de tickets."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String, Text

from backend.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(512), nullable=False)
    body = Column(Text, nullable=False, default="")
    processed_text = Column(Text, nullable=True)          # auditoría: texto exacto al modelo
    category = Column(String(32), nullable=False)         # bug | feature | question
    priority = Column(String(16), nullable=False)         # Alta | Media | Baja
    priority_rank = Column(Integer, nullable=False, index=True)  # 0 | 1 | 2 (orden)
    confidence = Column(Float, nullable=False)
    probabilities = Column(Text, nullable=True)           # JSON {clase: prob}; para el detalle/UI
    created_at = Column(DateTime(timezone=True), nullable=False, default=_utcnow, index=True)
    model_version = Column(String(128), nullable=False)   # ej. distilbert_2026-06-03_v1
