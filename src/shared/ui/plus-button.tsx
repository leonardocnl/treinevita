/*
 * PlusButton: "+ LABEL". An ink circle with a "+" (28px in empty states, 32px
 * for "Adicionar widget" and sheet rows) and the label in Mona 900/125 at 13px.
 * No background around the label. `as="span"` draws it inside a larger tappable
 * area (a manual widget) without nesting buttons.
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { cx } from "./cx";
import { Icon } from "./icons";

type PlusButtonProps = {
    children?: ReactNode;
    size?: 28 | 32;
};

function PlusMark({ size }: { size: 28 | 32 }) {
    return (
        <span
            aria-hidden
            className={cx(
                "flex shrink-0 items-center justify-center rounded-full bg-ink text-bg",
                size === 28 ? "size-7" : "size-8",
            )}
        >
            <Icon name="plus" size={size === 28 ? 16 : 18} />
        </span>
    );
}

export function PlusButton({
    children,
    size = 28,
    ...props
}: PlusButtonProps & ActionElementProps) {
    return (
        <ActionElement
            {...props}
            className="pressable focus-ring inline-flex min-h-11 items-center gap-gutter text-ink"
        >
            <PlusMark size={size} />
            {children ? <span className="action text-13">{children}</span> : null}
        </ActionElement>
    );
}

/** The same look as a plain span, for a parent that is already the button. */
export function PlusLabel({ children, size = 28 }: PlusButtonProps) {
    return (
        <span className="inline-flex min-h-11 items-center gap-gutter text-ink">
            <PlusMark size={size} />
            {children ? <span className="action text-13">{children}</span> : null}
        </span>
    );
}
