type WeekRingProps = {
    done: number;
    goal: number;
    size?: number;
};

/** Ring split into one segment per planned workout of the week. */
export function WeekRing({ done, goal, size = 112 }: WeekRingProps) {
    const segments = Math.max(goal, 1);
    const gapDegrees = segments > 1 ? 10 : 0;
    const sweep = 360 / segments - gapDegrees;
    const radius = 54;
    const center = 70;

    const arcs = Array.from({ length: segments }, (_, index) => {
        const start = -90 + index * (360 / segments) + gapDegrees / 2;
        const end = start + sweep;
        return { path: describeArc(center, center, radius, start, end), filled: index < done };
    });

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 140 140"
            role="img"
            aria-label={`${done} de ${goal} treinos feitos na semana`}
            fill="none"
            strokeWidth={13}
            strokeLinecap="round"
        >
            {arcs.map((arc, index) => (
                <path
                    key={index}
                    d={arc.path}
                    className={arc.filled ? "stroke-red" : "stroke-track"}
                />
            ))}
        </svg>
    );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function polar(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
