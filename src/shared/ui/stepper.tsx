/*
 * Stepper: segment lines, one 4px rounded segment per step, 4px apart, filling
 * the width. Done ink, current red, future off. With `onSelect` each segment is
 * a button (the session timeline jumps to that exercise).
 */
import { cx } from "./cx";

export type StepState = "done" | "current" | "future";

type StepperProps = {
    steps: readonly StepState[];
    onSelect?: (index: number) => void;
    /** Spoken name of each step ("Supino reto, concluído"). */
    stepLabel?: (index: number) => string;
    label: string;
};

const toneClass: Record<StepState, string> = {
    done: "bg-ink",
    current: "bg-accent",
    future: "bg-off",
};

export function Stepper({ steps, onSelect, stepLabel, label }: StepperProps) {
    return (
        <ol aria-label={label} className="flex min-w-0 flex-1 items-center gap-1">
            {steps.map((state, index) => (
                <li key={index} className="flex min-w-0 flex-1">
                    {onSelect ? (
                        <button
                            type="button"
                            onClick={() => onSelect(index)}
                            aria-label={stepLabel?.(index)}
                            aria-current={state === "current" ? "step" : undefined}
                            // The segment is 4px; the button grows its hit area to 44px high.
                            className="focus-ring relative flex h-11 w-full items-center"
                        >
                            <span
                                className={cx(
                                    "h-1 w-full rounded-full transition-opacity duration-(--vita-duration-snappy)",
                                    toneClass[state],
                                )}
                            />
                        </button>
                    ) : (
                        <span
                            aria-label={stepLabel?.(index)}
                            className={cx("h-1 w-full rounded-full", toneClass[state])}
                        />
                    )}
                </li>
            ))}
        </ol>
    );
}
