/*
 * The bottom bar of a task screen (workout, onboarding): fixed 20px from the
 * sides and 34px from the bottom (or the safe area, if larger), no surface.
 * It has its own view transition name, so it crossfades in place while screens slide.
 */
import { ViewTransition, type ReactNode } from "react";

export function BottomBar({ children }: { children: ReactNode }) {
    return (
        <ViewTransition name="vita-bar">
            <div className="pointer-events-none fixed inset-x-0 bottom-[max(34px,env(safe-area-inset-bottom))] z-20 flex justify-center px-margin">
                <div className="pointer-events-auto flex w-full max-w-md items-center gap-gutter">
                    {children}
                </div>
            </div>
        </ViewTransition>
    );
}

/** Room under a screen's content for the bottom bar (64px) and 32px of air. */
export const BOTTOM_BAR_CLEARANCE = "pb-[calc(max(34px,env(safe-area-inset-bottom))+96px)]";
