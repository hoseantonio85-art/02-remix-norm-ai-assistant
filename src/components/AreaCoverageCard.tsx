export function AreaCoverageCard({
  percent, status, knowledgeCount, needsUpdateCount, onOpen,
}: {
  percent: number;
  status: string;
  knowledgeCount: number;
  needsUpdateCount?: number;
  onOpen: () => void;
}) {
  const tone = percent >= 70 ? "ok" : percent >= 40 ? "warn" : "low";
  const kWord =
    knowledgeCount === 1 ? "знание" :
    knowledgeCount >= 2 && knowledgeCount <= 4 ? "знания" : "знаний";
  return (
    <button type="button" className="np-area-cov" onClick={onOpen}>
      <div className="np-area-cov-head">
        <div className="np-area-cov-title">Знание области</div>
        <div className="np-area-cov-percent">{percent}%</div>
      </div>
      <div className="np-area-cov-status">{status}</div>
      <div className="np-area-cov-count">
        {knowledgeCount} {kWord}
        {needsUpdateCount && needsUpdateCount > 0
          ? ` · ${needsUpdateCount} требуют обновления`
          : ""}
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