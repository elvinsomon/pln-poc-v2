/* Componentes compartidos: iconos SVG, badges, helpers de formato. */
import React from "react";
import { CATEGORIES } from "./api.js";

/* ---------- Iconos (stroke currentColor) ---------- */
export function Icon({ path, size = 16, fill = false, stroke = 2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"} strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true">
      {path}
    </svg>
  );
}

export const IconBug = (p) => <Icon {...p} path={<><path d="M8 6v-.5a4 4 0 0 1 8 0V6"/><rect x="6" y="6" width="12" height="12" rx="6"/><path d="M3 11h3M18 11h3M3 16h3M18 16h3M4 7l2 1M20 7l-2 1M12 6v12"/></>} />;
export const IconFeature = (p) => <Icon {...p} path={<><path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5 10.1 7.6z"/><path d="M19 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/></>} />;
export const IconQuestion = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none"/></>} />;
export const IconSearch = (p) => <Icon {...p} path={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>} />;
export const IconPlus = (p) => <Icon {...p} path={<path d="M12 5v14M5 12h14"/>} />;
export const IconInbox = (p) => <Icon {...p} path={<><path d="M3 13h4l2 3h6l2-3h4"/><path d="M5 6h14l2 7v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z"/></>} />;
export const IconClock = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>} />;
export const IconCheck = (p) => <Icon {...p} path={<path d="M20 6L9 17l-5-5"/>} />;
export const IconChevron = (p) => <Icon {...p} path={<path d="M9 6l6 6-6 6"/>} />;
export const IconClose = (p) => <Icon {...p} path={<path d="M6 6l12 12M18 6L6 18"/>} />;
export const IconBolt = (p) => <Icon {...p} path={<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>} />;
export const IconFilter = (p) => <Icon {...p} path={<path d="M3 5h18l-7 8v6l-4 2v-8z"/>} />;
export const IconArrowRight = (p) => <Icon {...p} path={<path d="M5 12h14M13 6l6 6-6 6"/>} />;
export const IconSort = (p) => <Icon {...p} path={<><path d="M7 4v16M7 20l-3-3M7 4l3 3"/><path d="M17 4v16"/><path d="M14 8l3-4 3 4"/></>} />;

export const CAT_ICON = { bug: IconBug, feature: IconFeature, question: IconQuestion };

/* ---------- Badges ---------- */
export function CategoryBadge({ cat, size = "md" }) {
  const Ico = CAT_ICON[cat] || IconQuestion;
  const label = (CATEGORIES[cat] || {}).label || cat;
  const cls = size === "sm" ? "cat-badge cat-badge--sm" : "cat-badge";
  return (
    <span className={cls} data-cat={cat}>
      <Ico size={size === "sm" ? 13 : 15} stroke={1.9} />
      <span>{label}</span>
    </span>
  );
}

export function PriorityPill({ p, variant = "pill" }) {
  if (variant === "dot") {
    return <span className="pri-dot" data-pri={p} title={"Prioridad " + p} />;
  }
  return (
    <span className="pri-pill" data-pri={p}>
      <span className="pri-pill__dot" />
      {p}
    </span>
  );
}

/* ---------- Confianza ---------- */
export function ConfidenceMeter({ value, compact = false }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 85 ? "high" : pct >= 72 ? "mid" : "low";
  if (compact) {
    return <span className="conf-chip" data-tone={tone}>{pct}%</span>;
  }
  return (
    <div className="conf">
      <div className="conf__track">
        <div className="conf__fill" data-tone={tone} style={{ width: pct + "%" }} />
      </div>
      <span className="conf__val" data-tone={tone}>{pct}%</span>
    </div>
  );
}

/* ---------- Formato de tiempo ---------- */
export function timeAgo(iso) {
  const now = new Date();
  const then = new Date(iso);
  const mins = Math.round((now - then) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return "hace " + mins + " min";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return "hace " + hrs + " h";
  const days = Math.round(hrs / 24);
  return "hace " + days + (days === 1 ? " día" : " días");
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" })
    + " · " + d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}

export function fmtDateFull(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    + " · " + d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" });
}
