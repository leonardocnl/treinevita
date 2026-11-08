/*
 * The action pill: the screen's main action. A 48px ink pill (it inverts in
 * dark mode) with the label on the left, an optional secondary part, and a
 * red circle with a white icon at the right end, the same 4px from the top,
 * the bottom and the end (concentric corners, see concentric.ts).
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { PILL } from "./concentric";
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
            style={{ height: PILL.height, padding: PILL.gap, paddingLeft: 20 }}
            className={cx(
                "pressable flex w-full items-center justify-between gap-3 rounded-full bg-ink text-canvas disabled:opacity-60",
                grow && "flex-1",
            )}
        >
            <span className="flex min-w-0 items-baseline gap-2 truncate text-[15px] font-normal">
                {children}
                {detail !== undefined ? (
                    <span className="text-[13px] text-on-ink-secondary">{detail}</span>
                ) : null}
            </span>
            <AccentCircle>{icon}</AccentCircle>
        </ActionElement>
    );
}
