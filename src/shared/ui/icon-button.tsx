/*
 * IconButton: a 40px circle with the tint background and a 20px icon, with a
 * 44×44px hit area. The aria-label (in Portuguese) is required by its type.
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { cx } from "./cx";
import { Icon, type IconName } from "./icons";

type IconButtonProps = ActionElementProps & {
    "aria-label": string;
    /** The icon, or custom content (the theme toggle) as children. */
    icon?: IconName;
    children?: ReactNode;
    /** Layout only (keep the space but hide it, an optical offset). */
    className?: string;
};

export function IconButton({ icon, children, className, ...props }: IconButtonProps) {
    return (
        <ActionElement
            {...props}
            className={cx(
                "pressable focus-ring tap-target flex size-10 shrink-0 items-center justify-center rounded-full bg-tint text-ink disabled:opacity-40",
                className,
            )}
        >
            {icon ? <Icon name={icon} size={20} /> : children}
        </ActionElement>
    );
}
