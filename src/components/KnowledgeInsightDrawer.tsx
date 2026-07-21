import type { AreaInsight, ProfileInsight } from "../data/profile_insights";
import { CoverageRing } from "./CoverageRing";

export function KnowledgeInsightDrawer({
  title, percent, status, insight, onClose,
}: {
  title: string;
  percent: number;
  status: string;
  insight: AreaInsight | ProfileInsight | undefined;
  onClose: () => void;
}) {
  const fallback = "Пока недостаточно данных для содержательного вывода.";
  return (
    <div className="np-drawer-backdrop" onClick={onClose}>
      <div className="np-drawer" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="np-drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="np-drawer-eyebrow">Индекс знания</div>
            <h3 className="np-drawer-title">{title}</h3>
            <div className="np-drawer-metrics">
              <CoverageRing percent={percent} size={56} />
              <div className="np-drawer-metrics-status">{status}</div>
            </div>
            <p className="np-drawer-summary">{insight?.summary || fallback}</p>
          </div>
          <button className="np-icon-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="np-drawer-body">
          {insight?.observations && insight.observations.length > 0 && (
            <section className="np-drawer-section">
              <h4>Что я вижу</h4>
              <ul className="np-drawer-list">
                {insight.observations.slice(0, 5).map((o, i) => <li key={i}>{o.text}</li>)}
              </ul>
            </section>
          )}
          {insight?.conclusions && insight.conclusions.length > 0 && (
            <section className="np-drawer-section">
              <h4>Что из этого следует</h4>
              <ul className="np-drawer-list">
                {insight.conclusions.slice(0, 5).map((c, i) => <li key={i}>{c.text}</li>)}
              </ul>
            </section>
          )}
          {insight?.riskImpacts && insight.riskImpacts.length > 0 && (
            <section className="np-drawer-section">
              <h4>На какие риски влияет</h4>
              <ul className="np-drawer-risks">
                {insight.riskImpacts.slice(0, 6).map((r, i) => (
                  <li key={i}>
                    <div className="np-drawer-risk-area">{r.area}</div>
                    <div className="np-drawer-risk-why">{r.explanation}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {insight?.blindSpots && insight.blindSpots.length > 0 && (
            <section className="np-drawer-section">
              <h4>Где не хватает контекста</h4>
              <ul className="np-drawer-list">
                {insight.blindSpots.slice(0, 5).map((b, i) => <li key={i}>{b.text}</li>)}
              </ul>
            </section>
          )}
          {!insight && (
            <section className="np-drawer-section">
              <p className="np-muted">{fallback}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}