/*
 * The widget grid: 2 columns on the phone and 4 from 768px, square rows sized
 * from the container width, dense packing so small tiles fill the holes.
 */
import type { ReactNode } from "react";

export function WidgetGrid({ children }: { children: ReactNode }) {
    return (
        <div className="@container">
            <div className="widget-grid grid grid-cols-2 gap-3 [grid-auto-flow:dense] md:grid-cols-4">
                {children}
            </div>
        </div>
    );
}
