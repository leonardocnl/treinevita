/*
 * The inside of a widget tile: the title at the top left, an optional aside at
 * the top right (a caption, a dot ring, a status dot) and the content below,
 * usually pushed to the bottom with mt-auto.
 */
import type { ReactNode } from "react";

type WidgetFrameProps = {
    title: string;
    aside?: ReactNode;
    children: ReactNode;
};

export function WidgetFrame({ title, aside, children }: WidgetFrameProps) {
    return (
        <div className="flex h-full flex-col p-4">
            <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] text-ink-secondary">{title}</p>
                {aside}
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
    );
}
