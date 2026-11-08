/*
 * The single dot every dotted display is built from (DotMeter, WeekRows, the
 * seven days in Semana), and StatusDot: the small red dot that marks what is
 * happening or what went up.
 */
const fillClass = {
    ink: "bg-ink",
    red: "bg-red",
    off: "bg-dot-off",
    hairline: "bg-hairline",
    "on-panel": "bg-on-panel",
    "panel-track": "bg-panel-track",
} as const;

const ringClass = {
    off: "ring-1 ring-dot-off ring-inset",
    red: "ring-[1.5px] ring-red ring-inset",
} as const;

export type DotFill = keyof typeof fillClass;

type DotProps = {
    /** Diameter in px. */
    size: number;
    /** A filled dot... */
    fill?: DotFill;
    /** ...or an empty one with an inner outline. */
    ring?: keyof typeof ringClass;
    /** Layout only. */
    className?: string;
};

export function Dot({ size, fill, ring, className }: DotProps) {
    const classes = [
        "rounded-full",
        className,
        fill && fillClass[fill],
        !fill && ring && ringClass[ring],
    ]
        .filter(Boolean)
        .join(" ");
    return <span aria-hidden className={classes} style={{ width: size, height: size }} />;
}

type StatusDotProps = {
    /** Spoken text; without it the dot is decorative. */
    label?: string;
    size?: 6 | 7;
    /** Layout only. */
    className?: string;
};

/** A red status dot, 6px (7px on the dark panel). */
export function StatusDot({ label, size = 6, className }: StatusDotProps) {
    const classes = ["shrink-0 rounded-full bg-red", className].filter(Boolean).join(" ");
    return label ? (
        <span
            role="img"
            aria-label={label}
            className={classes}
            style={{ width: size, height: size }}
        />
    ) : (
        <span aria-hidden className={classes} style={{ width: size, height: size }} />
    );
}
