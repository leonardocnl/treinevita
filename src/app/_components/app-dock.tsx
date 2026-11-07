import Link from "next/link";
import type { ReactNode } from "react";

import { ChartIcon, DumbbellIcon, ScaleIcon, SummaryIcon } from "@/shared/ui/icons";

type Tab = "resumo" | "treinos" | "evolucao" | "corpo";

const tabs: { id: Tab; href: string; label: string; Icon: typeof SummaryIcon }[] = [
    { id: "resumo", href: "/", label: "Resumo", Icon: SummaryIcon },
    { id: "treinos", href: "/treinos", label: "Treinos", Icon: DumbbellIcon },
    { id: "evolucao", href: "/evolucao", label: "Evolução", Icon: ChartIcon },
    { id: "corpo", href: "/corpo", label: "Corpo", Icon: ScaleIcon },
];

/** Floating glass bar: the screen's main action on top, navigation below. */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),14px)]">
            <div className="glass pointer-events-auto flex w-full max-w-md flex-col gap-0.5 rounded-surface p-2">
                {action}
                <nav aria-label="Navegação principal" className="grid h-[54px] grid-cols-4">
                    {tabs.map(({ id, href, label, Icon }) => {
                        const isActive = id === active;
                        return (
                            <Link
                                key={id}
                                href={href}
                                aria-current={isActive ? "page" : undefined}
                                className={`pressable flex flex-col items-center justify-center gap-[3px] text-[10px] ${
                                    isActive
                                        ? "font-semibold text-ink"
                                        : "font-medium text-ink-secondary"
                                }`}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2 : 1.8} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
