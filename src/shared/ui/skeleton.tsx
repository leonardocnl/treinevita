/*
 * Loading states: the screen's own shapes, dimmed (off, at the real sizes), no
 * shimmer. They fade in after 150ms, so a fast load never flashes them.
 */
import { cx } from "./cx";

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cx("skeleton rounded-[4px] bg-off", className)} />;
}

/** The frame of a loading screen: announced once as busy, with the screen's margins. */
export function SkeletonScreen({ children }: { children: React.ReactNode }) {
    return (
        <main
            aria-busy="true"
            aria-label="Carregando"
            className="pt-top mx-auto w-full max-w-md px-margin pb-[136px]"
        >
            {children}
        </main>
    );
}
