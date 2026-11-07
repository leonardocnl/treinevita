import Link from "next/link";
import type { ReactNode } from "react";

type Tab = "resumo" | "treinos" | "evolucao" | "corpo";

const tabs: { id: Tab; href: string; label: string }[] = [
    { id: "resumo", href: "/", label: "Resumo" },
    { id: "treinos", href: "/treinos", label: "Treinos" },
    { id: "evolucao", href: "/evolucao", label: "Evolução" },
    { id: "corpo", href: "/corpo", label: "Corpo" },
];

/** Floating frosted bar with text tabs and, at the end, the screen's main action. */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="float-bar pointer-events-auto flex w-full max-w-md items-center gap-1.5 rounded-[34px] p-2">
                <nav aria-label="Navegação principal" className="h-14 flex-1">
                    <ul className="grid h-full grid-cols-4">
                        {tabs.map((tab) => {
                            const isActive = tab.id === active;
                            return (
                                <li key={tab.id} className="flex">
                                    <Link
                                        href={tab.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`pressable flex flex-1 items-center justify-center text-[13px] transition-colors ${
                                            isActive
                                                ? "font-medium text-ink"
                                                : "text-ink-secondary hover:text-ink"
                                        }`}
                                    >
                                        {tab.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                {action}
            </div>
        </div>
    );
}
