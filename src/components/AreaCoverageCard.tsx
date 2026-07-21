export function AreaCoverageCard({
  percent, status, knowledgeCount, signal, onOpen,
}: {
  percent: number;
  status: string;
  knowledgeCount: number;
  needsUpdateCount?: number;
  signal?: { tone: "conflict" | "warning" | "stale"; label: string } | null;
  onOpen: () => void;
}) {
  const tone = percent >= 70 ? "ok" : percent >= 40 ? "warn" : "low";
  const kWord =
    knowledgeCount === 1 ? "знание" :
    knowledgeCount >= 2 && knowledgeCount <= 4 ? "знания" : "знаний";
  return (
    <button type="button" className="np-area-cov" onClick={onOpen}>
      <div className="np-area-coverage-heading">
        <span className={`np-area-coverage-title np-area-cov-status--${tone}`}>
          {status}
        </span>
        <strong className="np-area-coverage-percent">{percent}%</strong>
      </div>
      <div className="np-area-coverage-meta">
        <span>{knowledgeCount} {kWord}</span>
        {signal && (
          <>
            <span className="np-meta-divider" aria-hidden>·</span>
            <span className={`np-area-coverage-signals np-area-signal--${signal.tone}`}>
              {signal.label}
            </span>
          </>
        )}
      </div>
      <div className="np-area-cov-bar">
        <div className={`np-progress np-progress--sm np-progress--${tone}`}>
          <div className="np-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="np-area-cov-foot">
        <span>Как Норм понимает область</span>
        <span className="np-area-cov-chev" aria-hidden>›</span>
      </div>
    </button>
  );
}