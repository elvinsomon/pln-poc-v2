"""Endpoints de clasificación y alta de tickets."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Ticket
from backend.schemas import PredictResponse, TicketCreate, TicketResponse
from backend.services.model_service import get_model_service
from backend.services.priority import derive_priority, rank_for

router = APIRouter(tags=["tickets"])


@router.post("/predict", response_model=PredictResponse)
def predict_only(payload: TicketCreate) -> PredictResponse:
    """Clasifica SIN persistir (preview para el frontend)."""
    svc = get_model_service()
    r = svc.predict(payload.title, payload.body)
    prio = derive_priority(r.label)
    return PredictResponse(
        category=r.label,
        priority=prio.value,
        confidence=r.confidence,
        probabilities=r.probabilities,
        model_version=svc.version,
    )


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)) -> TicketResponse:
    """Clasifica -> deriva prioridad -> persiste -> devuelve el ticket."""
    svc = get_model_service()
    processed = svc.preprocess(payload.title, payload.body)
    r = svc.predict(payload.title, payload.body)
    prio = derive_priority(r.label)

    ticket = Ticket(
        title=payload.title,
        body=payload.body,
        processed_text=processed,
        category=r.label,
        priority=prio.value,
        priority_rank=rank_for(prio),
        confidence=r.confidence,
        probabilities=json.dumps(r.probabilities),   # se persiste como JSON
        model_version=svc.version,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    # model_validate + field_validator parsean la columna JSON -> dict en la respuesta.
    return TicketResponse.model_validate(ticket)
