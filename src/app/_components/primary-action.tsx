import type { ReactNode } from "react";

/** Round red action beside the dock (start or continue a workout). */
export const roundActionClass =
    "pressable flex size-14 shrink-0 items-center justify-center rounded-full bg-red text-white shadow-[0_18px_40px_-18px_rgb(255_23_68/0.8)]";

/** Round smoke-glass button (secondary actions such as undo). */
export const roundSmokeClass =
    "smoke pressable flex size-14 shrink-0 items-center justify-center rounded-full";

/** Wide smoke-glass pill with a red action circle at the end. */
export const pillActionClass =
    "smoke pressable flex h-14 w-full items-center justify-between rounded-full pl-6 pr-1.5 disabled:opacity-60";

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
