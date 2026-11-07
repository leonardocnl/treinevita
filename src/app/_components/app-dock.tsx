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
 * Floating bottom bar: a smoke-glass chip with the tabs (the active one lit
 * by a red light rising from the bottom edge) and, beside it, the screen's
 * main action as a round button.
 */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    const index = tabs.findIndex((tab) => tab.id === active);
    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),20px)]">
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-2.5">
                <nav
                    aria-label="Navegação principal"
                    className="smoke relative h-14 flex-1 overflow-hidden rounded-full"
                >
                    {index >= 0 ? (
                        <>
                            <span
                                aria-hidden
                                className="limelight absolute inset-y-0 w-1/4 transition-[left] duration-300 ease-out"
                                style={{ left: `${index * 25}%` }}
                            />
                            <span
                                aria-hidden
                                className="absolute bottom-0 h-0.5 w-6 -translate-x-1/2 rounded-full bg-red shadow-[0_0_10px_var(--vita-red)] transition-[left] duration-300 ease-out"
                                style={{ left: `${index * 25 + 12.5}%` }}
                            />
                        </>
                    ) : null}
                    <ul className="relative grid h-full grid-cols-4">
                        {tabs.map((tab) => {
                            const isActive = tab.id === active;
                            return (
                                <li key={tab.id} className="flex">
                                    <Link
                                        href={tab.href}
                                        aria-current={isActive ? "page" : undefined}
                                        className={`flex flex-1 items-center justify-center text-[13px] transition-colors ${
                                            isActive
                                                ? "font-medium text-on-panel"
                                                : "font-normal text-on-panel-secondary hover:text-on-panel"
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
