"""Esquemas Pydantic de petición/respuesta."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TicketCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    body: str = Field(default="", max_length=20000)


class PredictResponse(BaseModel):
    """Resultado de clasificación sin persistir (dry-run / preview)."""
    category: str
    priority: str
    confidence: float
    probabilities: dict[str, float]
    model_version: str


class TicketResponse(BaseModel):
    """Ticket persistido."""
    id: int
    title: str
    category: str
    priority: str
    priority_rank: int
    confidence: float
    probabilities: dict[str, float] | None = None  # se devuelve al crear; no se persiste por clase
    created_at: datetime
    model_version: str

    model_config = {"from_attributes": True}
