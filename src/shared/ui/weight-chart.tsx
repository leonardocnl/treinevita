/*
 * The weight chart (DESIGN.md, "Charts"): 4 gridlines at 15% ink with their
 * values on the right (10px, 600), the line in ink at 2px, the area under it
 * filled with a dot matrix (1.3px dots every 7px, ink at 28%), a hollow start
 * point and a red end point. `compact` keeps only the line, the dots and the
 * end point (the P sparkline). It scales uniformly to its container's width.
 */
import { useId } from "react";

type ChartPoint = { readonly day: string; readonly value: number };

type WeightChartProps = {
    points: readonly ChartPoint[];
    width: number;
    height: number;
    compact?: boolean;
    label: string;
    /** Formats a gridline value ("73,0"). */
    format: (value: number) => string;
};

const PAD = 4;
const VALUES_WIDTH = 32;

export function WeightChart({
    points,
    width,
    height,
    compact = false,
    label,
    format,
}: WeightChartProps) {
    const id = useId().replace(/:/g, "");
    if (points.length < 2) {
        return null;
    }
    const values = points.map((point) => point.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const margin = Math.max(0.5, (rawMax - rawMin) * 0.15);
    const min = rawMin - margin;
    const max = rawMax + margin;
    const plotRight = width - (compact ? PAD : VALUES_WIDTH);
    const x = (index: number) => PAD + (index / (points.length - 1)) * (plotRight - PAD);
    const y = (value: number) => PAD + (1 - (value - min) / (max - min)) * (height - PAD * 2);
    const line = points.map(
        (point, index) => `${x(index).toFixed(1)},${y(point.value).toFixed(1)}`,
    );
    const area = `M${line.join(" L")} L${x(points.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;
    const grid = [0, 1, 2, 3].map((step) => min + ((max - min) * (step + 0.5)) / 4);
    const first = points[0];
    const last = points[points.length - 1];

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
            className="block h-auto w-full overflow-visible text-ink"
        >
            <defs>
                <pattern id={`dots-${id}`} width={7} height={7} patternUnits="userSpaceOnUse">
                    <circle cx={3.5} cy={3.5} r={0.65} fill="currentColor" fillOpacity={0.28} />
                </pattern>
            </defs>
            {compact
                ? null
                : grid.map((value) => (
                      <g key={value}>
                          <line
                              x1={PAD}
                              x2={plotRight}
                              y1={y(value)}
                              y2={y(value)}
                              stroke="currentColor"
                              strokeOpacity={0.15}
                              strokeWidth={1}
                          />
                          <text
                              x={width}
                              y={y(value)}
                              textAnchor="end"
                              dominantBaseline="middle"
                              className="fill-secondary text-10 font-semibold"
                          >
                              {format(value)}
                          </text>
                      </g>
                  ))}
            <path d={area} fill={`url(#dots-${id})`} />
            <polyline
                points={line.join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
            {compact ? null : (
                <circle
                    cx={x(0)}
                    cy={y(first.value)}
                    r={3.5}
                    className="fill-bg"
                    stroke="currentColor"
                    strokeWidth={2}
                />
            )}
            <circle cx={x(points.length - 1)} cy={y(last.value)} r={3.5} className="fill-accent" />
        </svg>
    );
}
