/*
 * Placeholder blocks shown by loading.tsx while a screen's data is on its way:
 * flat hairline shapes with the screen's layout, no shimmer. They fade in after
 * a short delay, so a fast load never flashes them.
 */
import { cx } from "./cx";

export function Skeleton({ className }: { className?: string }) {
    return <div aria-hidden className={cx("skeleton rounded-2xl bg-hairline", className)} />;
}

/** The frame of a loading screen: announced once as busy, with the safe-area padding. */
export function SkeletonScreen({ children }: { children: React.ReactNode }) {
    return (
        <main
            aria-busy="true"
            aria-label="Carregando"
            className="mx-auto w-full max-w-5xl px-5 pb-32 pt-[max(env(safe-area-inset-top),52px)] md:px-10 md:pt-16"
        >
            {children}
        </main>
    );
}
