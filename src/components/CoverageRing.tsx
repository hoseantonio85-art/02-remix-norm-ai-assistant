import type { CSSProperties } from "react";

function toneColor(percent: number): string {
  if (percent >= 70) return "#16a34a";
  if (percent >= 40) return "#eab308";
  return "#ef4444";
}

export function CoverageRing({
  percent, size = 46, thickness = 5, label,
}: { percent: number; size?: number; thickness?: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = toneColor(clamped);
  const bg = "#eef2f0";
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: `conic-gradient(${color} ${clamped * 3.6}deg, ${bg} 0)`,
  };
  const innerSize = size - thickness * 2;
  return (
    <div
      className="np-ring"
      style={style}
      role="img"
      aria-label={label || `Покрытие ${clamped}%`}
    >
      <div
        className="np-ring-inner"
        style={{
          width: innerSize,
          height: innerSize,
          fontSize: size <= 40 ? 11 : 12,
        }}
      >
        {clamped}%
      </div>
    </div>
  );
}