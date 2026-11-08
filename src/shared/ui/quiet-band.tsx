/*
 * The quiet band: a faint pill across a dark panel that marks the selected row
 * of the selection wheels. Purely decorative, placed absolutely by the parent.
 */
type QuietBandProps = {
    /** Distance from the top of the positioned parent, in px. */
    top: number;
    height: number;
};

export function QuietBand({ top, height }: QuietBandProps) {
    return (
        <div
            aria-hidden
            className="quiet pointer-events-none absolute inset-x-0 rounded-full"
            style={{ top, height }}
        />
    );
}
