/*
 * The action pill: the screen's main action. A 48px ink pill (it inverts in
 * dark mode) with the label on the left, an optional secondary part, and a
 * red circle with a white icon at the right end.
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { AccentCircle } from "./round-action";
import { cx } from "./cx";

type PillActionProps = ActionElementProps & {
    /** The label, at 15px. */
    children: ReactNode;
    /** Icon inside the red circle (check, arrow). */
    icon: ReactNode;
    /** Secondary text after the label, at 13px ("3 de 8"). */
    detail?: ReactNode;
    /** Grow to fill a flex row (next to the undo button). */
    grow?: boolean;
};

export function PillAction({ children, icon, detail, grow = false, ...props }: PillActionProps) {
    return (
        <ActionElement
            {...props}
            className={cx(
                "pressable flex h-12 w-full items-center justify-between rounded-full bg-ink pl-5 pr-1 text-canvas disabled:opacity-60",
                grow && "flex-1",
            )}
        >
            <span className="flex items-baseline gap-2 text-[15px] font-normal">
                {children}
                {detail !== undefined ? (
                    <span className="text-[13px] text-on-ink-secondary">{detail}</span>
                ) : null}
            </span>
            <AccentCircle>{icon}</AccentCircle>
        </ActionElement>
    );
}
