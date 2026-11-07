/*
 * The 44px light glass buttons at the top of the workout screens (back, video).
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { cx } from "./cx";

type GlassIconButtonProps = ActionElementProps & {
    /** Required: the button only shows an icon. */
    "aria-label": string;
    children: ReactNode;
    /** Layout only (an optical offset, hiding on desktop while keeping the space). */
    className?: string;
};

export function GlassIconButton({ className, ...props }: GlassIconButtonProps) {
    return (
        <ActionElement
            {...props}
            className={cx(
                "glass-light pressable flex size-11 items-center justify-center rounded-full",
                className,
            )}
        />
    );
}
