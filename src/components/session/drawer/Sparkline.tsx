import type { SparklinePoint } from "@/types/session";

interface SparklineProps {
  points: SparklinePoint[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  points,
  width = 140,
  height = 32,
  className,
}: SparklineProps) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const xStep = width / (points.length - 1);
  const padding = 3;
  const usableH = height - padding * 2;

  const coords = points.map((p, i) => {
    const x = i * xStep;
    const y = padding + usableH - ((p.value - min) / range) * usableH;
    return { x, y, point: p };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const lastIndex = coords.length - 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <path d={areaPath} fill="currentColor" opacity={0.08} />
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => {
        const isLast = i === lastIndex;
        return (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={isLast ? 3 : 2}
            fill={isLast ? "currentColor" : "white"}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            {c.point.label && (
              <title>
                {c.point.label} — {c.point.value}%
              </title>
            )}
          </circle>
        );
      })}
    </svg>
  );
}
