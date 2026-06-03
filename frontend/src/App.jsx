/* App shell: navegación (Resumen / Bandeja / Registrar), store de tickets vía API. */
import React from "react";
import { getHealth, listTickets, createTicket } from "./api.js";
import { Icon, IconInbox, IconPlus, IconBolt } from "./components.jsx";
import { DashboardView } from "./views/Dashboard.jsx";
import { InboxView } from "./views/Inbox.jsx";
import { RegisterView } from "./views/Register.jsx";

export default function App() {
  const [view, setView] = React.useState("dashboard");
  const [tickets, setTickets] = React.useState([]);
  const [newId, setNewId] = React.useState(null);
  const [health, setHealth] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [h, list] = await Promise.all([
          getHealth().catch(() => null),
          listTickets(),
        ]);
        if (!alive) return;
        setHealth(h);
        setTickets(list);
      } catch (err) {
        if (alive) setError(err.message || "No se pudo conectar con el backend.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // POST /tickets -> prepend al store; devuelve el ticket (con probabilities) al Register.
  async function handleCreate({ title, body }) {
    const ticket = await createTicket({ title, body });
    setTickets((prev) => [ticket, ...prev]);
    setNewId(ticket.id);
    return ticket;
  }

  const modelOk = health && health.status === "ok";
  const modelVersion = (health && health.model_version) || "—";

  const NAV = [
    { id: "dashboard", label: "Resumen", icon: <Icon size={18} path={<><rect x="3" y="3" width="8" height="9" rx="1.5"/><rect x="13" y="3" width="8" height="5" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/></>} /> },
    { id: "inbox", label: "Bandeja", icon: <IconInbox size={18} />, badge: tickets.length },
    { id: "register", label: "Registrar", icon: <IconPlus size={18} /> },
  ];

  return (
    <div className="app" data-density="regular" data-excerpt="true">
      <aside className="nav">
        <div className="brand">
          <div className="brand__mark"><IconBolt size={17} fill /></div>
          <div className="brand__txt">
            <div className="brand__name">Triaje</div>
            <div className="brand__tag">Soporte · PLN</div>
          </div>
        </div>

        <div className="nav__label">Operación</div>
        <nav className="nav__items">
          {NAV.map((it) => (
            <button key={it.id} className="navitem" data-on={view === it.id} onClick={() => setView(it.id)}>
              {it.icon}
              <span>{it.label}</span>
              {it.badge != null && <span className="navitem__badge">{it.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="nav__foot">
          <div className="nav__model">
            <span className="nav__modeldot" style={{ background: modelOk ? "var(--ok)" : "var(--ink-3)" }} />
            {modelOk ? "Modelo activo" : "Modelo no disponible"}
          </div>
          <div className="nav__modelv">{modelVersion}</div>
        </div>
      </aside>

      <main className="main">
        <div className="page">
          {loading ? (
            <div className="loading"><span className="spinner" /> Cargando datos del backend…</div>
          ) : (
            <>
              {error && <div className="banner-error">{error}</div>}
              {view === "dashboard" && (
                <DashboardView tickets={tickets} onGoInbox={() => setView("inbox")} onGoRegister={() => setView("register")} />
              )}
              {view === "inbox" && (
                <InboxView tickets={tickets} showConfidence newId={newId} onGoRegister={() => setView("register")} />
              )}
              {view === "register" && (
                <RegisterView onCreate={handleCreate} onGoInbox={() => setView("inbox")} modelVersion={modelOk ? modelVersion : null} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
