/*
 * The floating bar: a frosted pill fixed at the bottom of the screen that holds
 * the tabs and the screen's main action. With `inlineOnDesktop` it stops
 * floating from 768px and sits under the content at full width.
 */
import type { ReactNode } from "react";
import { cx } from "./cx";

type FloatBarProps = {
    children: ReactNode;
    inlineOnDesktop?: boolean;
};

export function FloatBar({ children, inlineOnDesktop = false }: FloatBarProps) {
    return (
        <div
            className={cx(
                "pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),20px)]",
                inlineOnDesktop && "md:static md:mt-8 md:px-0 md:pb-0",
            )}
        >
            <div
                className={cx(
                    "float-bar pointer-events-auto flex w-full max-w-md items-center gap-1 rounded-full p-2",
                    inlineOnDesktop && "md:max-w-none",
                )}
            >
                {children}
            </div>
        </div>
    );
}
