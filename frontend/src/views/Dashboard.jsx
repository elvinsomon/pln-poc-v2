/* Vista: Dashboard. KPIs + gráficos (tickets/tiempo, barras por categoría) + widgets.
   Todas las métricas se calculan en cliente desde el array de tickets. */
import React from "react";
import { CategoryBadge, Icon, IconInbox, IconBolt, IconClock, timeAgo } from "../components.jsx";

const DASH_CATS = ["bug", "feature", "question"];
const DASH_PRIS = ["Alta", "Media", "Baja"];

function dayKey(d) { return d.toISOString().slice(0, 10); }

export function DashboardView({ tickets, onGoInbox }) {
  const m = React.useMemo(() => computeMetrics(tickets), [tickets]);

  return (
    <div className="dash">
      <div className="phead">
        <h1 className="phead__title">Resumen</h1>
        <p className="phead__sub"><IconBolt size={13} /> Triaje automático de tickets de soporte · datos en vivo de la cola</p>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi__k"><IconInbox size={14} /> Pendientes</div>
          <div className="kpi__v">{m.total}</div>
          <div className="kpi__foot">en la cola de triaje</div>
        </div>
        <div className="kpi">
          <div className="kpi__k"><Icon size={14} path={<><path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17v.5"/></>} /> Prioridad alta</div>
          <div className="kpi__v">{m.byPri.Alta}</div>
          <div className="kpi__foot"><b>{m.altaPct}%</b> del total</div>
        </div>
        <div className="kpi">
          <div className="kpi__k"><IconBolt size={14} /> Confianza media</div>
          <div className="kpi__v">{m.avgConf}<small>%</small></div>
          <div className="kpi__foot">del clasificador</div>
        </div>
        <div className="kpi">
          <div className="kpi__k"><IconClock size={14} /> Ingresados hoy</div>
          <div className="kpi__v">{m.today}</div>
          <div className="kpi__foot">últimas 24 h</div>
        </div>
      </div>

      {/* Tiempo + prioridad */}
      <div className="grid2">
        <div className="card">
          <div className="card__head">
            <span className="card__title">Tickets por día</span>
            <span className="card__hint">últimos 7 días · {m.weekTotal} en total</span>
          </div>
          <AreaChart series={m.series} />
        </div>
        <div className="card">
          <div className="card__head">
            <span className="card__title">Por prioridad</span>
            <span className="card__hint">cola actual</span>
          </div>
          <div className="pdist">
            {DASH_PRIS.map((p) => (
              <div className="pdrow" data-pri={p} key={p}>
                <span className="pdrow__lbl"><span className="pri-dot" data-pri={p} /> {p}</span>
                <span className="pdrow__track"><span className="pdrow__fill" style={{ width: (m.total ? m.byPri[p] / m.total * 100 : 0) + "%" }} /></span>
                <span className="pdrow__n">{m.byPri[p]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categoría + confianza */}
      <div className="grid2b">
        <div className="card">
          <div className="card__head">
            <span className="card__title">Distribución por categoría</span>
            <span className="card__hint">cantidad de tickets</span>
          </div>
          <div className="bars">
            {DASH_CATS.map((c) => (
              <div className="barcol" key={c}>
                <span className="barcol__val">{m.byCat[c]}</span>
                <div className="barcol__track">
                  <div className="barcol__bar" data-cat={c} style={{ height: (m.maxCat ? m.byCat[c] / m.maxCat * 100 : 0) + "%" }} />
                </div>
                <span className="barcol__lbl"><CategoryBadge cat={c} size="sm" /></span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card__head">
            <span className="card__title">Confianza del modelo</span>
            <span className="card__hint">promedio por categoría</span>
          </div>
          <div className="gauge">
            <Ring pct={m.avgConf} />
            <div className="gauge__legend">
              {DASH_CATS.map((c) => (
                <div className="gauge__li" key={c}>
                  <CategoryBadge cat={c} size="sm" />
                  <span className="gauge__lk">{m.confByCat[c]}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recientes */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Actividad reciente</span>
          <button className="card__hint" onClick={onGoInbox} style={{ cursor: "pointer", color: "var(--accent)", fontWeight: 500 }}>Ver bandeja →</button>
        </div>
        <div className="recent">
          {m.recent.map((t) => (
            <div className="recent__row" key={t.id}>
              <span className="pri-dot" data-pri={t.priority} />
              <span className="recent__title">{t.title}</span>
              <CategoryBadge cat={t.category} size="sm" />
              <span className="recent__time">{timeAgo(t.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function computeMetrics(tickets) {
  const now = new Date();
  const total = tickets.length;
  const byPri = { Alta: 0, Media: 0, Baja: 0 };
  const byCat = { bug: 0, feature: 0, question: 0 };
  const confSum = { bug: 0, feature: 0, question: 0 };
  let confTotal = 0, today = 0;
  tickets.forEach((t) => {
    byPri[t.priority]++; byCat[t.category]++;
    confSum[t.category] += t.confidence; confTotal += t.confidence;
    if ((now - new Date(t.created_at)) <= 24 * 3600 * 1000) today++;
  });
  const confByCat = {};
  DASH_CATS.forEach((c) => { confByCat[c] = byCat[c] ? Math.round(confSum[c] / byCat[c] * 100) : 0; });

  // serie últimos 7 días
  const buckets = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    buckets[dayKey(d)] = { label: d.toLocaleDateString("es-DO", { weekday: "short" }).replace(".", ""), value: 0 };
  }
  tickets.forEach((t) => {
    const k = dayKey(new Date(t.created_at));
    if (buckets[k]) buckets[k].value++;
  });
  const series = Object.values(buckets);
  const weekTotal = series.reduce((a, s) => a + s.value, 0);

  const recent = [...tickets].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  return {
    total, byPri, byCat, today,
    altaPct: total ? Math.round(byPri.Alta / total * 100) : 0,
    avgConf: total ? Math.round(confTotal / total * 100) : 0,
    confByCat,
    series, weekTotal,
    maxCat: Math.max(byCat.bug, byCat.feature, byCat.question, 1),
    recent,
  };
}

/* ---------- Gráfico de área (SVG) ---------- */
function AreaChart({ series }) {
  const W = 620, H = 180, padL = 26, padR = 10, padT = 14, padB = 26;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const n = series.length;
  const rawMax = Math.max(...series.map((s) => s.value), 1);
  const niceMax = Math.max(2, Math.ceil(rawMax / 2) * 2);
  const x = (i) => padL + (n === 1 ? innerW / 2 : i * innerW / (n - 1));
  const y = (v) => padT + innerH - (v / niceMax) * innerH;
  const pts = series.map((s, i) => [x(i), y(s.value)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `M${pts[0][0].toFixed(1)} ${(padT + innerH).toFixed(1)} ` +
    pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
    ` L${pts[n - 1][0].toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;
  const ticks = [0, niceMax / 2, niceMax];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tk, i) => (
          <g key={i}>
            <line className="chart__grid" x1={padL} x2={W - padR} y1={y(tk)} y2={y(tk)} />
            <text className="chart__yl" x={padL - 7} y={y(tk) + 3} textAnchor="end">{tk}</text>
          </g>
        ))}
        <path className="chart__area" d={area} />
        <path className="chart__line" d={line} />
        {pts.map((p, i) => <circle key={i} className="chart__dot" cx={p[0]} cy={p[1]} r="3.2" />)}
        {series.map((s, i) => (
          <text key={i} className="chart__xl" x={x(i)} y={H - 8} textAnchor="middle">{s.label}</text>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Anillo de confianza ---------- */
function Ring({ pct }) {
  const r = 52, C = 2 * Math.PI * r;
  return (
    <div className="gauge__ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#eef0f3" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--accent)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 60 60)" />
      </svg>
      <div className="gauge__num">
        <span className="gauge__pct">{pct}%</span>
        <span className="gauge__cap">media</span>
      </div>
    </div>
  );
}
