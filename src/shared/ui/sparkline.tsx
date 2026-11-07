type SparklineProps = {
    values: readonly number[];
    width?: number;
    height?: number;
    label: string;
};

/** Small trend line; the last point is marked in red. */
export function Sparkline({ values, width = 128, height = 30, label }: SparklineProps) {
    if (values.length < 2) {
        return null;
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pad = 4;
    const points = values.map((value, index) => ({
        x: pad + (index / (values.length - 1)) * (width - pad * 2),
        y: height - pad - ((value - min) / span) * (height - pad * 2),
    }));
    const last = points[points.length - 1];

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={label}
            fill="none"
        >
            <polyline
                points={points
                    .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
                    .join(" ")}
                className="stroke-ink"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <circle cx={last.x} cy={last.y} r={3.5} className="fill-red" />
        </svg>
    );
}
