"""Siembra de datos demo para la PoC (idempotente).

Inserta ~14 tickets de soporte genéricos **en inglés** (el modelo activo,
distilbert-base-uncased, fue entrenado sobre issues de GitHub en inglés). Cada
ticket se clasifica con el MODELO REAL (categoría, prioridad, confianza,
probabilidades) y se inserta con un `created_at` repartido en los últimos días
para que el dashboard (serie de 7 días, KPI "hoy") y la bandeja se vean poblados.

Uso (desde la raíz del proyecto pln-poc-v2/, con el venv que tenga torch+transformers):
    python -m backend.seed_demo

Solo siembra si la tabla está vacía; si ya hay tickets, no hace nada.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from backend.config import settings
from backend.database import SessionLocal, init_db
from backend.models import Ticket
from backend.services.model_service import ModelService
from backend.services.priority import derive_priority, rank_for

# (title, body, días_atrás, horas_atrás) — solo el texto guía al modelo; la
# categoría/prioridad las decide el clasificador real.
DEMO = [
    ("App crashes when opening transaction history",
     "Since the latest update, tapping 'Transaction history' closes the app on Android. It happens to several customers.", 0, 1),
    ("500 error when validating ID on signup",
     "Registering a new beneficiary returns a 500 error and won't let us continue. It blocks onboarding new customers.", 0, 4),
    ("Exchange rate is not updating on the screen",
     "The teller monitor at desk 3 shows yesterday's rate. Quoting dollars displays a wrong value and we recalculate by hand.", 1, 2),
    ("Duplicate charge when sending a payment",
     "A customer reports being charged twice for a single transfer. They need an urgent reversal and are waiting at the branch.", 0, 6),
    ("Confirmation SMS never arrives",
     "Some customers on one carrier don't receive the confirmation code by SMS. They have to retry several times.", 1, 7),
    ("PDF receipt shows the logo cropped",
     "When printing the payment receipt, the company logo is cut off in the top corner. Cosmetic, but it looks unprofessional.", 2, 0),
    ("Allow exporting the daily report to Excel",
     "It would be very useful to export the cash close to Excel instead of only PDF, to reconcile with accounting faster.", 1, 3),
    ("Add a branch filter to the dashboard",
     "Please let the management panel filter transactions by branch; today it only shows the consolidated total.", 2, 4),
    ("Dark mode for the agent console",
     "We spend many hours in front of the screen, it would be nice to have an optional dark mode to rest our eyes.", 3, 1),
    ("Notify when a transfer stays pending",
     "I'd like the system to automatically alert the agent when a transfer has been unclaimed for more than 30 minutes.", 2, 8),
    ("How do I reverse an already confirmed transaction?",
     "I need to know the procedure to reverse a payment the customer confirmed by mistake. I can't find the option in the menu.", 0, 5),
    ("Where can I see a customer's daily limit?",
     "A customer asks how much they can send today and I don't know which screen shows the accumulated limit.", 1, 9),
    ("Does the system support payments in euros?",
     "A customer wants to receive a transfer in euros. Is it possible, or do we only handle dollars and pesos?", 3, 5),
    ("Is there a manual to train a new cashier?",
     "Is there a manual or video to onboard a new cashier on the remittance module? They start on Monday.", 4, 2),
]


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        existing = db.query(Ticket).count()
        if existing:
            print(f"La tabla ya tiene {existing} ticket(s); no se siembra nada.")
            return

        svc = ModelService(settings.ARTIFACTS_DIR)
        svc.load()
        print(f"Modelo cargado: {svc.version} ({svc.type}). Sembrando {len(DEMO)} tickets…")

        now = datetime.now(timezone.utc)
        for title, body, days, hours in DEMO:
            r = svc.predict(title, body)
            prio = derive_priority(r.label)
            ticket = Ticket(
                title=title,
                body=body,
                processed_text=svc.preprocess(title, body),
                category=r.label,
                priority=prio.value,
                priority_rank=rank_for(prio),
                confidence=r.confidence,
                probabilities=json.dumps(r.probabilities),
                created_at=now - timedelta(days=days, hours=hours),
                model_version=svc.version,
            )
            db.add(ticket)
            print(f"  + #{title[:48]:<48} -> {r.label}/{prio.value} ({r.confidence:.0%})")
        db.commit()
        print(f"Listo: {db.query(Ticket).count()} tickets en la BD.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
