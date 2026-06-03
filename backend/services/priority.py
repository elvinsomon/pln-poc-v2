"""Derivación de prioridad desde la categoría predicha + rango de orden.

Regla (confirmada): bug=Alta, question=Media, feature=Baja.
La lista del admin se ordena por prioridad (Alta->Media->Baja) y, dentro de
cada nivel, por fecha de creación ascendente (más antiguo primero, triaje FIFO).
"""
from __future__ import annotations

from enum import Enum

from common.constants import CATEGORY_TO_PRIORITY, PRIORITY_RANK


class Priority(str, Enum):
    ALTA = "Alta"
    MEDIA = "Media"
    BAJA = "Baja"


def derive_priority(category: str) -> Priority:
    """Categoría -> prioridad. Media como defensa ante categorías inesperadas."""
    return Priority(CATEGORY_TO_PRIORITY.get(category, "Media"))


def rank_for(priority: Priority) -> int:
    """Rango numérico (0=Alta, 1=Media, 2=Baja) para el ORDER BY."""
    return PRIORITY_RANK[priority.value]
