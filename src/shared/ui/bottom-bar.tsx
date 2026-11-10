/*
 * The bottom bar of a task screen (workout, onboarding): a glass surface from
 * the bottom edge up, so content scrolling under it blurs instead of colliding
 * with its text. Controls sit 20px from the sides and 34px from the bottom (or
 * the safe area, if larger). `above` holds a row on the same glass (e.g. "Próximo").
 * It has its own view transition name, so it crossfades in place while screens slide.
 */
import { ViewTransition, type ReactNode } from "react";

export function BottomBar({ children, above }: { children: ReactNode; above?: ReactNode }) {
    return (
        <ViewTransition name="vita-bar">
            <div className="glass fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-label px-margin pt-label pb-[max(34px,env(safe-area-inset-bottom))]">
                {above ? <div className="w-full max-w-md">{above}</div> : null}
                <div className="flex w-full max-w-md items-center gap-gutter">{children}</div>
            </div>
        </ViewTransition>
    );
}

/** Room under a screen's content for the bottom bar (64px + 16px of glass) and 32px of air. */
export const BOTTOM_BAR_CLEARANCE = "pb-[calc(max(34px,env(safe-area-inset-bottom))+112px)]";
