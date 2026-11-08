/*
 * A thin horizontal bar: the value in ink over an unlit track, with an optional
 * red reference mark (the 10 weekly sets in "Volume por músculo").
 */
type ProgressBarProps = {
    value: number;
    max: number;
    /** Position of the red reference mark, in the same unit as value. */
    reference?: number;
    /** Text alternative; leave it out when the number is printed next to the bar. */
    label?: string;
};

export function ProgressBar({ value, max, reference, label }: ProgressBarProps) {
    const share = (amount: number) => `${(Math.min(amount, max) / max) * 100}%`;
    return (
        <span
            className="relative h-1.5 rounded-full bg-dot-off"
            {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
        >
            <span
                className="absolute inset-y-0 left-0 rounded-full bg-ink"
                style={{ width: share(value) }}
            />
            {reference !== undefined ? (
                <span
                    aria-hidden
                    className="absolute -inset-y-1 w-px bg-red"
                    style={{ left: share(reference) }}
                />
            ) : null}
        </span>
    );
}
