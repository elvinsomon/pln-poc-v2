"""Endpoints de consulta del historial de tickets (vista de administrador)."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Ticket
from backend.schemas import TicketResponse

router = APIRouter(tags=["tickets"])


@router.get("/tickets", response_model=list[TicketResponse])
def list_tickets(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    priority: Optional[str] = Query(None, description="Filtrar por prioridad"),
    limit: int = Query(100, ge=1, le=500),
) -> list[Ticket]:
    """Lista ordenada: prioridad (Alta->Media->Baja) y, dentro, fecha asc (FIFO)."""
    q = db.query(Ticket)
    if category:
        q = q.filter(Ticket.category == category)
    if priority:
        q = q.filter(Ticket.priority == priority)
    q = q.order_by(Ticket.priority_rank.asc(), Ticket.created_at.asc())
    return q.limit(limit).all()


@router.get("/tickets/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    return ticket
