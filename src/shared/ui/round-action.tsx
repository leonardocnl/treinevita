/*
 * The red action: a 48px red circle with a white icon that starts or continues
 * a workout (RoundAction), and the same circle as a plain shape inside other
 * controls (AccentCircle: the end of the action pill, the "+" in a sheet row).
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";

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
    /** 44px at the end of the action pill, 32px in list rows. */
    size?: 44 | 32;
};

export function AccentCircle({ children, size = 44 }: AccentCircleProps) {
    return size === 44 ? (
        <span className="flex size-11 items-center justify-center rounded-full bg-red text-on-red">
            {children}
        </span>
    ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red text-[20px] leading-none text-on-red">
            {children}
        </span>
    );
}
