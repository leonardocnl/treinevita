import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/shared/ui/icons";

type PrimaryActionProps = {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
};

/** Content of the main black button: title and context on the left, red action circle on the right. */
export function PrimaryActionContent({ title, subtitle, icon }: PrimaryActionProps) {
    return (
        <>
            <span className="flex flex-col gap-0.5 text-left">
                <span className="text-[19px] font-bold leading-tight">{title}</span>
                {subtitle ? (
                    <span className="text-[13px] text-on-ink-secondary">{subtitle}</span>
                ) : null}
            </span>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red text-white">
                {icon ?? <ArrowRightIcon size={22} />}
            </span>
        </>
    );
}

export const primaryActionClass =
    "pressable flex h-16 w-full items-center justify-between rounded-control bg-ink pl-5 pr-2 text-paper disabled:opacity-60";
