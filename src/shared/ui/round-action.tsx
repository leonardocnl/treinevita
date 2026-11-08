/*
 * The red action: a 48px red circle with a white icon that starts or continues
 * a workout (RoundAction), and the same circle as a plain shape inside other
 * controls (AccentCircle: the end of the action pill, the "+" in a sheet row).
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { PILL_CIRCLE } from "./concentric";

type RoundActionProps = ActionElementProps & {
    /** Required: the button only shows an icon. */
    "aria-label": string;
    children: ReactNode;
};

export function RoundAction(props: RoundActionProps) {
    return (
        <ActionElement
            {...props}
            className="pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-red text-on-red"
        />
    );
}

type AccentCircleProps = {
    children: ReactNode;
    /** "pill": inside the action pill, sized by the concentric rule; 32: in list rows. */
    size?: "pill" | 32;
};

export function AccentCircle({ children, size = "pill" }: AccentCircleProps) {
    return size === "pill" ? (
        <span
            className="flex shrink-0 items-center justify-center rounded-full bg-red text-on-red"
            style={{ width: PILL_CIRCLE, height: PILL_CIRCLE }}
        >
            {children}
        </span>
    ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red text-on-red">
            {children}
        </span>
    );
}
