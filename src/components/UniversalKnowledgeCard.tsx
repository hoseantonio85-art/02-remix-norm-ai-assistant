import type { UniversalKnowledge } from "../types/universalKnowledge";
import { UniversalValueRenderer } from "./UniversalValueRenderer";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatRuDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const mo = parseInt(m[2], 10) - 1;
  if (mo < 0 || mo > 11) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS_RU[mo]} ${m[1]}`;
}

function freshnessClass(code: string | null | undefined): string {
  switch (code) {
    case "current": return "np-tag np-tag-ok";
    case "stale":
    case "outdated": return "np-tag np-tag-warning";
    case "expired": return "np-tag np-tag-danger";
    default: return "np-tag";
  }
}

export function UniversalKnowledgeCard({ k }: { k: UniversalKnowledge }) {
  const stateCode = k.state?.code;
  const showStateBadge =
    stateCode === "partial" || stateCode === "known_empty" || stateCode === "conflicting";
  const stateTone =
    stateCode === "conflicting"
      ? "np-tag np-tag-warning"
      : stateCode === "partial"
        ? "np-tag np-tag-warning"
        : "np-tag";

  const freshness = k.metadata?.freshness;
  const sources = k.sources || [];
  const visibleSources = sources.slice(0, 2);
  const moreSources = sources.length - visibleSources.length;

  return (
    <article className="np-k-card" id={`uk-${k.id}`}>
      <header className="np-k-head">
        <div className="np-k-title-wrap">
          <h3 className="np-k-title">{k.title}</h3>
          {showStateBadge && (
            <div className="np-uv-badges">
              <span className={stateTone}>{k.state.label}</span>
            </div>
          )}
        </div>
        <div className="np-k-status">
          {freshness?.label && (
            <span className={freshnessClass(freshness.code)} title={freshness.reason || ""}>
              {freshness.label}
            </span>
          )}
          <button
            type="button"
            className="np-uv-menu"
            aria-label="Действия"
            onClick={(e) => e.preventDefault()}
          >
            …
          </button>
        </div>
      </header>

      {k.description && <p className="np-k-summary">{k.description}</p>}

      <div className="np-k-body">
        <UniversalValueRenderer node={k.content} parentTitle={k.title} />
      </div>

      {k.alerts && k.alerts.length > 0 && (
        <div className="np-uv-alerts">
          {k.alerts.map((a) => (
            <div key={a.id} className={`np-uv-alert np-uv-alert--${a.severity}`}>
              {a.message}
            </div>
          ))}
        </div>
      )}

      {(sources.length > 0 || k.metadata?.actualAt || k.metadata?.origin?.name) && (
        <footer className="np-uv-footer">
          {sources.length > 0 && (
            <div className="np-uv-foot-row">
              <span className="np-uv-foot-label">Источники:</span>
              <span className="np-uv-foot-val">
                {visibleSources
                  .map((s) => (s.dataset ? `${s.name} · ${s.dataset}` : s.name))
                  .join(", ")}
                {moreSources > 0 ? `, ещё ${moreSources}` : ""}
              </span>
            </div>
          )}
          {k.metadata?.actualAt && (
            <div className="np-uv-foot-row">
              <span className="np-uv-foot-label">Актуально на:</span>
              <span className="np-uv-foot-val">{formatRuDate(k.metadata.actualAt)}</span>
            </div>
          )}
          {k.metadata?.origin?.name && (
            <div className="np-uv-foot-row">
              <span className="np-uv-foot-label">Источник данных:</span>
              <span className="np-uv-foot-val">{k.metadata.origin.name}</span>
            </div>
          )}
        </footer>
      )}
    </article>
  );
}