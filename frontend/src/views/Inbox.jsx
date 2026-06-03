/* Vista: Bandeja de pendientes — tabla. Click en fila abre drawer con todo el detalle. */
import React from "react";
import {
  CategoryBadge, PriorityPill, ConfidenceMeter, timeAgo, fmtDate, fmtDateFull,
  IconSort, IconSearch, IconClose, IconChevron, IconInbox, IconPlus, IconClock,
  IconBolt, IconArrowRight,
} from "../components.jsx";

const PRI_ORDER = ["Alta", "Media", "Baja"];

export function sortTickets(list) {
  return [...list].sort((a, b) =>
    a.priority_rank - b.priority_rank ||
    new Date(a.created_at) - new Date(b.created_at) // FIFO dentro de prioridad
  );
}

export function InboxView({ tickets, showConfidence = true, newId, onGoRegister }) {
  const [cat, setCat] = React.useState("all");
  const [pri, setPri] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(null);

  const filtered = React.useMemo(() => {
    let l = tickets;
    if (cat !== "all") l = l.filter((t) => t.category === cat);
    if (pri !== "all") l = l.filter((t) => t.priority === pri);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((t) => (t.title + " " + (t.body || "")).toLowerCase().includes(s));
    }
    return sortTickets(l);
  }, [tickets, cat, pri, q]);

  const counts = React.useMemo(() => {
    const c = { Alta: 0, Media: 0, Baja: 0 };
    tickets.forEach((t) => { c[t.priority]++; });
    return c;
  }, [tickets]);

  React.useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setSel(null); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="inbox">
      <div className="inbox__head">
        <div className="phead" style={{ margin: 0 }}>
          <h1 className="phead__title">Bandeja de pendientes</h1>
          <p className="phead__sub"><IconSort size={13} /> Orden por prioridad, luego FIFO por fecha de ingreso</p>
        </div>
        <div className="stat-row">
          {PRI_ORDER.map((p) => (
            <button key={p} className="stat" data-pri={p} data-on={pri === p}
              onClick={() => setPri(pri === p ? "all" : p)}>
              <span className="stat__dot" />
              <span className="stat__n">{counts[p]}</span>
              <span className="stat__l">{p}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="inbox__toolbar">
        <div className="search">
          <IconSearch size={16} />
          <input placeholder="Buscar en asunto o descripción…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="search__clear" onClick={() => setQ("")}><IconClose size={13} /></button>}
        </div>
        <div className="segmented">
          {[["all", "Todas"], ["bug", "Bug"], ["feature", "Feature"], ["question", "Question"]].map(([v, l]) => (
            <button key={v} data-on={cat === v} onClick={() => setCat(v)}>{l}</button>
          ))}
        </div>
        <div className="toolbar__count">{filtered.length} ticket{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState onGoRegister={onGoRegister} />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="tbl__pri">Prioridad</th>
                <th>Asunto</th>
                <th className="tbl__cat">Categoría</th>
                {showConfidence && <th className="tbl__conf">Confianza</th>}
                <th className="tbl__time">Recibido</th>
                <th className="tbl__id">ID</th>
                <th className="tbl__chev"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} data-pri={t.priority} data-new={t.id === newId}
                  data-sel={sel && sel.id === t.id} onClick={() => setSel(t)}>
                  <td className="tbl__pri"><PriorityPill p={t.priority} /></td>
                  <td>
                    <div className="tbl__subject">{t.title}</div>
                    <div className="tbl__excerpt">{t.body}</div>
                  </td>
                  <td className="tbl__cat"><CategoryBadge cat={t.category} size="sm" /></td>
                  {showConfidence && <td className="tbl__conf"><ConfidenceMeter value={t.confidence} compact /></td>}
                  <td className="tbl__time" title={fmtDate(t.created_at)}>{timeAgo(t.created_at)}</td>
                  <td className="tbl__id">#{t.id}</td>
                  <td className="tbl__chev"><IconChevron size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TicketDrawer ticket={sel} onClose={() => setSel(null)} />
    </div>
  );
}

/* ---------- Drawer de detalle ---------- */
function TicketDrawer({ ticket, onClose }) {
  const open = !!ticket;
  const [shown, setShown] = React.useState(ticket);
  React.useEffect(() => { if (ticket) setShown(ticket); }, [ticket]);
  const t = ticket || shown;

  return (
    <>
      <div className="scrim" data-open={open} onClick={onClose}
        style={{ pointerEvents: open ? "auto" : "none" }} />
      <aside className="drawer" data-open={open} data-pri={t ? t.priority : "Baja"}
        aria-hidden={!open}>
        <div className="drawer__bar" />
        {t && (
          <>
            <div className="drawer__head">
              <span className="drawer__id">Ticket #{t.id}</span>
              <button className="drawer__close" onClick={onClose} aria-label="Cerrar"><IconClose size={18} /></button>
            </div>
            <div className="drawer__body">
              <h2 className="drawer__title">{t.title}</h2>
              <div className="drawer__tags">
                <PriorityPill p={t.priority} />
                <CategoryBadge cat={t.category} />
                <span className="recent__time"><IconClock size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />{timeAgo(t.created_at)}</span>
              </div>

              <div className="drawer__sectk">Descripción</div>
              <p className="drawer__desc">{t.body || "Sin descripción adicional."}</p>

              <div className="drawer__sectk">Detalle</div>
              <div className="meta-grid">
                <div><div className="meta__k">Categoría</div><div className="meta__v"><CategoryBadge cat={t.category} size="sm" /></div></div>
                <div><div className="meta__k">Prioridad</div><div className="meta__v"><PriorityPill p={t.priority} /></div></div>
                <div><div className="meta__k">Rango de prioridad</div><div className="meta__v mono">{t.priority_rank}</div></div>
                <div><div className="meta__k">Confianza</div><div className="meta__v mono">{Math.round(t.confidence * 100)}%</div></div>
                <div style={{ gridColumn: "1/-1" }}><div className="meta__k">Fecha de ingreso</div><div className="meta__v mono">{fmtDateFull(t.created_at)}</div></div>
              </div>

              <div className="drawer__sectk">Análisis del modelo</div>
              <div className="ai-box">
                <div className="ai-box__head">
                  <IconBolt size={14} /> Distribución por categoría
                  <span className="ai-box__model">{t.model_version}</span>
                </div>
                {(() => {
                  const probs = t.probabilities || {};
                  const ordered = Object.keys(probs).sort((a, b) => probs[b] - probs[a]);
                  if (ordered.length === 0) {
                    return <p className="drawer__desc" style={{ fontSize: 13 }}>Sin distribución disponible.</p>;
                  }
                  return ordered.map((c) => (
                    <div className="probrow" key={c}>
                      <span className="probrow__label"><CategoryBadge cat={c} size="sm" /></span>
                      <span className="probrow__track">
                        <span className="probrow__fill" data-active={c === t.category} style={{ width: Math.round(probs[c] * 100) + "%" }} />
                      </span>
                      <span className="probrow__pct">{Math.round(probs[c] * 100)}%</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            <div className="drawer__foot">
              <button className="btn btn--ghost" disabled>Reasignar prioridad</button>
              <button className="btn btn--primary" disabled>Tomar ticket <IconArrowRight size={15} /></button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

function EmptyState({ onGoRegister }) {
  return (
    <div className="empty">
      <div className="empty__icon"><IconInbox size={30} stroke={1.5} /></div>
      <div className="empty__t">No hay tickets que coincidan</div>
      <div className="empty__s">Ajusta los filtros o registra uno nuevo.</div>
      <button className="btn btn--primary" onClick={onGoRegister}><IconPlus size={16} /> Registrar ticket</button>
    </div>
  );
}
