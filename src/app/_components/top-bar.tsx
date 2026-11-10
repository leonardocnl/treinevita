/*
 * The top bar of the main screens: the "vita" wordmark in Doto at 24px on the
 * left, circle icon buttons on the right. No date.
 */
import type { ReactNode } from "react";

import { Wordmark } from "@/shared/ui/wordmark";

export function TopBar({ children }: { children?: ReactNode }) {
    return (
        <div className="flex h-10 items-center justify-between gap-gutter">
            <Wordmark />
            {children ? <div className="flex items-center gap-gutter">{children}</div> : null}
        </div>
    );
}
