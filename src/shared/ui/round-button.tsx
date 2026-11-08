/*
 * Round secondary button with an icon: 48px and transparent in the bottom bar
 * (undo), 32px chips in ink or canvas on the widgets in edit mode.
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";

const variantClass = {
    "48-transparent": "size-12 shrink-0 text-ink",
    "32-ink": "size-8 bg-ink text-canvas",
    "32-canvas": "size-8 bg-canvas disabled:opacity-30",
} as const;

type RoundButtonProps = ActionElementProps & {
    /** Required: the button only shows an icon. */
    "aria-label": string;
    children: ReactNode;
    size?: 48 | 32;
    /** Only for the 32px size: an ink chip or a canvas chip. */
    tone?: "ink" | "canvas";
};

export function RoundButton({ size = 48, tone = "canvas", ...props }: RoundButtonProps) {
    const variant = size === 48 ? "48-transparent" : (`32-${tone}` as const);
    return (
        <ActionElement
            {...props}
            className={`pressable flex items-center justify-center rounded-full ${variantClass[variant]}`}
        />
    );
}
