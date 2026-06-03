/* Vista: Registrar ticket. Form -> POST /tickets (clasifica + persiste) -> resultado. */
import React from "react";
import {
  CategoryBadge, PriorityPill, ConfidenceMeter,
  IconBolt, IconArrowRight, IconCheck, IconPlus,
} from "../components.jsx";

export function RegisterView({ onCreate, onGoInbox, modelVersion }) {
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [phase, setPhase] = React.useState("form"); // form | classifying | done
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState(null);

  const canSubmit = title.trim().length > 0 && phase === "form";

  async function submit(e) {
    e && e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setPhase("classifying");
    try {
      const ticket = await onCreate({ title: title.trim(), body: body.trim() });
      setResult(ticket);
      setPhase("done");
    } catch (err) {
      setError(err.message || "No se pudo registrar el ticket.");
      setPhase("form");
    }
  }

  function reset() {
    setTitle(""); setBody(""); setResult(null); setError(null); setPhase("form");
  }

  return (
    <div className="reg">
      <div className="phead">
        <h1 className="phead__title">Registrar ticket</h1>
        <p className="phead__sub">El sistema clasifica la categoría y deriva la prioridad automáticamente al guardar.</p>
        {modelVersion && <div className="reg__model"><span className="reg__modeldot" /> {modelVersion}</div>}
      </div>

      {error && <div className="banner-error">{error}</div>}

      {phase !== "done" && (
        <form className="reg__card" onSubmit={submit}>
          <label className="field">
            <span className="field__label">
              Asunto <span className="field__req">obligatorio</span>
            </span>
            <input
              className="field__input"
              type="text"
              maxLength={512}
              placeholder="Describe el problema en una línea…"
              value={title}
              autoFocus
              disabled={phase === "classifying"}
              onChange={(e) => setTitle(e.target.value)}
            />
            <span className="field__count">{title.length}/512</span>
          </label>

          <label className="field">
            <span className="field__label">Descripción</span>
            <textarea
              className="field__input field__textarea"
              maxLength={20000}
              rows={7}
              placeholder="Da contexto: qué pasó, en qué pantalla, a quién afecta, si es urgente…"
              value={body}
              disabled={phase === "classifying"}
              onChange={(e) => setBody(e.target.value)}
            />
            <span className="field__count">{body.length.toLocaleString("es-DO")}/20.000</span>
          </label>

          <div className="reg__actions">
            <span className="reg__hint">
              <IconBolt size={14} /> La prioridad y categoría las asigna el modelo.
            </span>
            <button className="btn btn--primary" type="submit" disabled={!canSubmit}>
              {phase === "classifying" ? (
                <><span className="spinner" /> Clasificando…</>
              ) : (
                <>Clasificar y registrar <IconArrowRight size={16} /></>
              )}
            </button>
          </div>
        </form>
      )}

      {phase === "done" && result && (
        <ResultCard ticket={result} onReset={reset} onGoInbox={onGoInbox} />
      )}
    </div>
  );
}

function ResultCard({ ticket, onReset, onGoInbox }) {
  const probs = ticket.probabilities || {};
  const ordered = Object.keys(probs).sort((a, b) => probs[b] - probs[a]);
  return (
    <div className="result">
      <div className="result__banner" data-pri={ticket.priority}>
        <div className="result__check"><IconCheck size={18} stroke={2.4} /></div>
        <div>
          <div className="result__t">Ticket #{ticket.id} registrado</div>
          <div className="result__s">Entró a la bandeja con prioridad <strong>{ticket.priority}</strong></div>
        </div>
      </div>

      <div className="result__body">
        <div className="result__ticket">
          <div className="result__rowtitle">{ticket.title}</div>
          {ticket.body && <p className="result__rowbody">{ticket.body}</p>}
        </div>

        <div className="result__grid">
          <div className="result__cell">
            <div className="result__k">Categoría</div>
            <CategoryBadge cat={ticket.category} />
          </div>
          <div className="result__cell">
            <div className="result__k">Prioridad</div>
            <PriorityPill p={ticket.priority} />
          </div>
          <div className="result__cell result__cell--wide">
            <div className="result__k">Confianza del modelo</div>
            <ConfidenceMeter value={ticket.confidence} />
          </div>
        </div>

        {ordered.length > 0 && (
          <div className="result__probs">
            <div className="result__k">Distribución por categoría</div>
            {ordered.map((c) => (
              <div className="probrow" key={c}>
                <span className="probrow__label"><CategoryBadge cat={c} size="sm" /></span>
                <span className="probrow__track">
                  <span className="probrow__fill" data-active={c === ticket.category}
                    style={{ width: Math.round(probs[c] * 100) + "%" }} />
                </span>
                <span className="probrow__pct">{Math.round(probs[c] * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="result__actions">
        <button className="btn btn--ghost" onClick={onReset}>
          <IconPlus size={16} /> Registrar otro
        </button>
        <button className="btn btn--primary" onClick={onGoInbox}>
          Ver en la bandeja <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
