import Link from "next/link";
import type { ReactNode } from "react";

type Tab = "resumo" | "treinos" | "evolucao" | "corpo";

const tabs: { id: Tab; href: string; label: string }[] = [
    { id: "resumo", href: "/", label: "Resumo" },
    { id: "treinos", href: "/treinos", label: "Treinos" },
    { id: "evolucao", href: "/evolucao", label: "Evolução" },
    { id: "corpo", href: "/corpo", label: "Corpo" },
];

/**
 * Bottom bar in the "line" language: the canvas color with a hairline on top,
 * text tabs (the active one marked by a red dot) and, at the end, the screen's
 * main action as a red circle.
 */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)]">
            <div className="mx-auto flex h-[72px] w-full max-w-md items-center gap-3 px-4 md:max-w-5xl md:px-10">
                <nav aria-label="Navegação principal" className="h-full flex-1">
                    <ul className="grid h-full grid-cols-4 md:flex md:gap-10">
                        {tabs.map((tab) => {
                            const isActive = tab.id === active;
                            return (
                                <li key={tab.id} className="flex">
                                    <Link
                                        href={tab.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`relative flex flex-1 flex-col items-center justify-center gap-1.5 text-[13px] transition-colors md:flex-none ${
                                            isActive
                                                ? "font-normal text-ink"
                                                : "text-ink-secondary hover:text-ink"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            aria-hidden
                                            className={`size-[5px] rounded-full ${isActive ? "bg-red" : "bg-transparent"}`}
                                        />
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
