import { useState, type ReactNode } from "react";
import chartDataRaw from "../data/risk_objects_chart.json";

interface RiskObject {
  id: string;
  label: string;
  value: string;
  valueLabel: string;
  icon: string;
  labelPosition: { leftPct: number; topPct: number };
  potentialPath: string;
  assessmentPath: string;
  factDashes: string[];
}

const RISK_OBJECTS = chartDataRaw as RiskObject[];

// Local mini-icons for labels — small, muted, secondary
function MiniIcon({ name }: { name: string }) {
  const p: Record<string, ReactNode> = {
    law: (
      <>
        <path d="M12 3v18M5 8h14M8 8l-3 6a3 3 0 006 0zM16 8l-3 6a3 3 0 006 0z" />
      </>
    ),
    box: (
      <>
        <path d="M3 8l9-4 9 4v9l-9 4-9-4z" />
        <path d="M3 8l9 4 9-4M12 12v9" />
      </>
    ),
    rocket: (
      <>
        <path d="M14 4c3 0 6 3 6 6l-8 8-4-4zM8 14l-4 4 1 3 3-1 4-4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15 20c0-2.5 2-4 4-4" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4M7 10l2 2 3-4 3 3 2-2" />
      </>
    ),
    people: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c0-3 3-5 7-5s7 2 7 5" />
      </>
    ),
    server: (
      <>
        <rect x="3" y="4" width="18" height="6" rx="1.5" />
        <rect x="3" y="14" width="18" height="6" rx="1.5" />
        <path d="M7 7h.01M7 17h.01" />
      </>
    ),
  };
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {p[name] ?? null}
    </svg>
  );
}

interface Props {
  rightSlot?: ReactNode;
}

export default function RiskObjectsChart({ rightSlot }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className={`np-risk-chart-section${rightSlot ? " np-risk-chart-section--split" : ""}`}>
      <div className="np-island np-risk-chart-island">
        <div className="np-risk-chart-wrap">
          <svg
            className="np-risk-chart-svg"
            viewBox="0 0 678 500"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform="translate(339, 250)">
              {RISK_OBJECTS.map((s) => {
                const active = hovered === s.id;
                return (
                  <g
                    key={s.id}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer", transition: "opacity 180ms" }}
                  >
                    <path
                      d={s.potentialPath}
                      fill={active ? "#D1FAEF" : "#ECFDF8"}
                      style={{ transition: "fill 180ms" }}
                    />
                    <path
                      d={s.assessmentPath}
                      fill={active ? "#A8F0D8" : "#D1FAEF"}
                      style={{ transition: "fill 180ms" }}
                    />
                    {s.factDashes.map((d, i) => (
                      <path
                        key={i}
                        d={d}
                        fill="none"
                        stroke="#23D773"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                      />
                    ))}
                  </g>
                );
              })}
            </g>

            {/* Center label */}
            <g transform="translate(339, 250)" textAnchor="middle" style={{ pointerEvents: "none" }}>
              <text y={-4} fontSize={13} fill="#8a94a6">Прогноз</text>
              <text y={20} fontSize={20} fontWeight={600} fill="#111827">4.99 млн/₽</text>
            </g>
          </svg>

          {RISK_OBJECTS.map((s) => (
            <div
              key={s.id}
              className={`np-risk-label${hovered === s.id ? " is-active" : ""}`}
              style={{
                left: `${s.labelPosition.leftPct}%`,
                top: `${s.labelPosition.topPct}%`,
              }}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="np-risk-label-icon" aria-hidden>
                <MiniIcon name={s.icon} />
              </span>
              <div className="np-risk-label-name">{s.label}</div>
              <div className="np-risk-label-meta">
                <span className="np-risk-label-tag">{s.valueLabel}</span>
                <span className="np-risk-label-dot">·</span>
                <span className="np-risk-label-value">{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="np-risk-legend">
          <span className="np-risk-legend-item">
            <span className="np-risk-legend-swatch np-risk-legend-swatch--fact" />
            Факт
          </span>
          <span className="np-risk-legend-item">
            <span className="np-risk-legend-swatch np-risk-legend-swatch--limit" />
            Лимит
          </span>
          <span className="np-risk-legend-item">
            <span className="np-risk-legend-swatch np-risk-legend-swatch--forecast" />
            Прогноз
          </span>
        </div>
      </div>

      <aside className="np-risk-side">{rightSlot}</aside>
    </div>
  );
}

interface LossMetrics {
  actual: { value: number | null; limitUsage: number | null; limitValue: number | null };
  forecast: { value: number | null; delta: number | null };
}

export function RiskLossCards({ metrics }: { metrics: LossMetrics }) {
  const fmt = (v: number | null) => (v == null ? "—" : String(v));
  const empty = metrics.actual.value == null && metrics.forecast.value == null;
  return (
    <div className="np-risk-side-cards">
      <div className="np-risk-side-card">
        <div className="np-risk-side-card-head">Факт потерь</div>
        <div className="np-risk-side-card-value">{fmt(metrics.actual.value)}</div>
        {metrics.actual.limitValue != null ? (
          <div className="np-risk-side-card-sub">
            из {metrics.actual.limitValue}
            {metrics.actual.limitUsage != null ? ` · ${metrics.actual.limitUsage}%` : ""}
          </div>
        ) : empty ? (
          <div className="np-risk-side-card-empty">Данных пока нет</div>
        ) : null}
      </div>
      <div className="np-risk-side-card">
        <div className="np-risk-side-card-head">Прогноз потерь</div>
        <div className="np-risk-side-card-value">{fmt(metrics.forecast.value)}</div>
        {metrics.forecast.delta != null ? (
          <div className="np-risk-side-card-sub">
            {metrics.forecast.delta > 0 ? "+" : ""}
            {metrics.forecast.delta}% к текущему
          </div>
        ) : empty ? (
          <div className="np-risk-side-card-empty">Данных пока нет</div>
        ) : null}
      </div>
    </div>
  );
}