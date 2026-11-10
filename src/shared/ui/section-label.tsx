/*
 * SectionLabel: the 11px label that names a widget or a section, optionally
 * preceded by a 6px red dot (achievements) and with an optional meta at the right.
 */
import type { ReactNode } from "react";

import { Dot } from "./dot";

type SectionLabelProps = {
    children: ReactNode;
    meta?: ReactNode;
    /** An achievement: a red dot before the label. */
    accent?: boolean;
    as?: "h2" | "h3" | "p";
    id?: string;
};

export function SectionLabel({
    children,
    meta,
    accent = false,
    as: Tag = "h2",
    id,
}: SectionLabelProps) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-gutter">
            <Tag id={id} className="label flex min-w-0 items-center gap-inner">
                {accent ? <Dot size={6} tone="accent" /> : null}
                <span className="truncate">{children}</span>
            </Tag>
            {meta !== undefined ? (
                <span className="label shrink-0 tabular-nums">{meta}</span>
            ) : null}
        </div>
    );
}
