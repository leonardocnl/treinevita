/*
 * Progress as a circle of dots: the done share of the goal is red, the rest
 * unlit. Dot size is the larger of 5px and one fifteenth of the ring.
 */
type DotRingProps = {
    done: number;
    goal: number;
    /** Text alternative ("2 de 3 treinos feitos na semana"). */
    label: string;
    /** Diameter in px. */
    size?: number;
    dots?: number;
};

export function DotRing({ done, goal, label, size = 104, dots = 24 }: DotRingProps) {
    const filled = goal > 0 ? Math.round((Math.min(done, goal) / goal) * dots) : 0;
    const dot = Math.max(5, Math.round(size / 15));
    const radius = size / 2 - dot / 2;
    const center = size / 2;

    return (
        <div
            role="img"
            aria-label={label}
            className="relative shrink-0"
            style={{ width: size, height: size }}
        >
            {Array.from({ length: dots }, (_, index) => {
                const angle = -Math.PI / 2 + (index / dots) * Math.PI * 2;
                return (
                    <span
                        key={index}
                        className={`absolute rounded-full ${index < filled ? "bg-red" : "bg-dot-off"}`}
                        style={{
                            width: dot,
                            height: dot,
                            left: center + Math.cos(angle) * radius - dot / 2,
                            top: center + Math.sin(angle) * radius - dot / 2,
                        }}
                    />
                );
            })}
        </div>
    );
}
