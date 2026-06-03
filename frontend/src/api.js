/* Cliente del API del backend FastAPI. Sustituye al mock window.TriageData. */

const BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export const CATEGORIES = {
  bug: { id: "bug", label: "Bug" },
  feature: { id: "feature", label: "Feature" },
  question: { id: "question", label: "Question" },
};

// Alta -> Media -> Baja (rank menor = más urgente)
export const PRIORITIES = {
  Alta: { id: "Alta", label: "Alta", rank: 0 },
  Media: { id: "Media", label: "Media", rank: 1 },
  Baja: { id: "Baja", label: "Baja", rank: 2 },
};

async function asJson(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.detail || JSON.stringify(data);
    } catch { /* respuesta sin cuerpo JSON */ }
    throw new Error(`${res.status} · ${detail}`);
  }
  return res.json();
}

/** GET /health -> { status, model_version, model_type, classes } */
export async function getHealth() {
  return asJson(await fetch(`${BASE}/health`));
}

/** GET /tickets (orden prioridad->FIFO en el servidor). El filtrado fino se hace en cliente. */
export async function listTickets({ category, priority, limit = 200 } = {}) {
  const p = new URLSearchParams();
  if (category) p.set("category", category);
  if (priority) p.set("priority", priority);
  if (limit) p.set("limit", String(limit));
  return asJson(await fetch(`${BASE}/tickets?${p.toString()}`));
}

/** POST /tickets -> clasifica + persiste + devuelve el ticket (con probabilities). */
export async function createTicket({ title, body }) {
  return asJson(
    await fetch(`${BASE}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    })
  );
}
