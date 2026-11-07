/*
 * A Summary widget tile in one of three sizes, as on iOS: small (1×1), medium
 * (2×1) and large (2×2) cells of the WidgetGrid. In edit mode the content dims
 * and an overlay with the edit controls sits on top. WidgetAddTile is the
 * dashed tile that opens the "Adicionar widget" sheet.
 */
import type { CSSProperties, ReactNode } from "react";
import { cx } from "./cx";

export type WidgetTileSize = "small" | "medium" | "large";

const sizeClass: Record<WidgetTileSize, string> = {
    small: "col-span-1 row-span-1",
    medium: "col-span-2 row-span-1",
    large: "col-span-2 row-span-2",
};

type WidgetTileProps = {
    size: WidgetTileSize;
    /** The widget's name, for screen readers. */
    label: string;
    children: ReactNode;
    /** Position in the grid, for the staggered entrance. */
    index?: number;
    /** Edit mode: content dimmed and not interactive, with `overlay` on top. */
    overlay?: ReactNode;
};

export function WidgetTile({ size, label, children, index = 0, overlay }: WidgetTileProps) {
    const editing = overlay !== undefined;
    return (
        <article
            aria-label={label}
            style={{ "--stagger": index } as CSSProperties}
            className={cx(
                "rise-in relative overflow-hidden rounded-tile bg-paper",
                sizeClass[size],
                editing && "ring-1 ring-hairline",
            )}
        >
            <div className={cx("h-full", editing && "pointer-events-none opacity-40")}>
                {children}
            </div>
            {overlay}
        </article>
    );
}

export function WidgetAddTile({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="pressable col-span-1 row-span-1 flex flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-dot-off text-[15px] text-ink-secondary"
        >
            <span className="text-[28px] font-light leading-none text-ink">+</span>
            {label}
        </button>
    );
}
