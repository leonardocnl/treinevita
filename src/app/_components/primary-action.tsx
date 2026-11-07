import type { ReactNode } from "react";

/** Round red action (start or continue a workout). */
export const roundActionClass =
    "pressable flex size-12 shrink-0 items-center justify-center rounded-full bg-red text-white";

/** Round secondary button (undo). */
export const roundSecondaryClass =
    "pressable flex size-12 shrink-0 items-center justify-center rounded-full text-ink";

/** Wide pill in the ink color (inverts in dark mode) with a red action circle at the end. */
export const pillActionClass =
    "pressable flex h-12 w-full items-center justify-between rounded-full bg-ink pl-5 pr-1 text-canvas disabled:opacity-60";

export function PillActionContent({ children, icon }: { children: ReactNode; icon: ReactNode }) {
    return (
        <>
            <span className="flex items-baseline gap-2 text-[15px] font-normal">{children}</span>
            <span className="flex size-11 items-center justify-center rounded-full bg-red text-white">
                {icon}
            </span>
        </>
    );
}
