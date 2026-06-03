"""Esquemas Pydantic de petición/respuesta."""
from __future__ import annotations

import json
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


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
    body: str = ""
    category: str
    priority: str
    priority_rank: int
    confidence: float
    probabilities: dict[str, float] | None = None  # persistida como JSON; se parsea al leer
    created_at: datetime
    model_version: str

    model_config = {"from_attributes": True}

    @field_validator("probabilities", mode="before")
    @classmethod
    def _parse_probs(cls, v):
        """La columna se guarda como texto JSON; al leer del ORM lo convertimos a dict."""
        return json.loads(v) if isinstance(v, str) else v
