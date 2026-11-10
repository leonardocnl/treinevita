/*
 * Legacy wrapper of the set logger and the profile wheels: no surface in v2
 * (information never sits in a box). Removed with the set logger rebuild.
 */
import type { ReactNode } from "react";

export function Panel({ children, ...rest }: { children: ReactNode; "aria-label": string }) {
    return <section {...rest}>{children}</section>;
}

export function PanelNote({ children }: { children: ReactNode }) {
    return <p className="mt-label text-13 text-secondary">{children}</p>;
}
