/*
 * Lists separated by hairlines: List (the <ol> or <ul>), ListRow (one <li>
 * with a 1px divider under every row but the last) and ValueRow (a compact row
 * with a name on the left and a value on the right, used inside widgets).
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

type ListProps = {
    children: ReactNode;
    /** Ordered by default; "ul" when the order means nothing. */
    as?: "ol" | "ul";
    "aria-label"?: string;
    /** Layout only. */
    className?: string;
};

export function List({ as: Tag = "ol", children, ...rest }: ListProps) {
    return <Tag {...rest}>{children}</Tag>;
}

type ListRowProps = {
    children: ReactNode;
    /** Layout of the row's content (flex, grid, height, text size). */
    className?: string;
    style?: CSSProperties;
};

export function ListRow({ children, className, style }: ListRowProps) {
    return (
        <li className={cx("border-b border-hairline last:border-b-0", className)} style={style}>
            {children}
        </li>
    );
}

type ValueRowProps = {
    label: ReactNode;
    /** Shown on the right in secondary text with tabular figures ("40 × 10"). */
    value?: ReactNode;
    /** Anything else on the right instead of a value (a status dot). */
    marker?: ReactNode;
    /** sm: 26px rows; md: 28px rows with more room for the value. */
    size?: "sm" | "md";
};

export function ValueRow({ label, value, marker, size = "md" }: ValueRowProps) {
    return (
        <ListRow
            className={`flex items-center justify-between text-[13px] ${
                size === "sm" ? "h-[26px] gap-2" : "h-[28px] gap-3"
            }`}
        >
            <span className="truncate">{label}</span>
            {value !== undefined ? (
                <span className="shrink-0 tabular-nums text-ink-secondary">{value}</span>
            ) : null}
            {marker}
        </ListRow>
    );
}
