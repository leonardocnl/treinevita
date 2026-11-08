/*
 * The dark panel (radius 30, 20px padding) that looks the same in both themes:
 * the set logger. Text inside uses the on-panel tokens.
 */
import type { ReactNode } from "react";

type PanelProps = {
    children: ReactNode;
    /** Names the region for screen readers. */
    "aria-label": string;
};

export function Panel({ children, ...rest }: PanelProps) {
    return (
        <section className="panel rounded-panel p-5" {...rest}>
            {children}
        </section>
    );
}

/** A thin divider line inside the panel, above a closing note. */
export function PanelNote({ children }: { children: ReactNode }) {
    return (
        <p className="mt-4 border-t border-panel-divider px-1 pt-3.5 text-[13px] text-on-panel-secondary">
            {children}
        </p>
    );
}
