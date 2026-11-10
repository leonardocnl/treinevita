/*
 * AppNav: the glass navbar of the main screens. Floating 20px from the sides
 * and 34px from the bottom (or the safe area), 68px high, radius 20, paper at
 * 60% with a 24px blur, no border or shadow. Four equal slots, each a 24px icon
 * over an 11px label. Inactive: secondary at 600. Active: ink, the label in
 * 900/112 and a 4px red dot 6px under it. The bar keeps one view transition
 * name, so switching tabs crossfades the icon states in place.
 */
import Link from "next/link";
import { ViewTransition } from "react";

import { cx } from "@/shared/ui/cx";
import { Icon, type IconName } from "@/shared/ui/icons";

export type Tab = "resumo" | "treinos" | "evolucao" | "perfil";

const tabs: { id: Tab; href: string; label: string; icon: IconName }[] = [
    { id: "resumo", href: "/", label: "Resumo", icon: "summary" },
    { id: "treinos", href: "/treinos", label: "Treinos", icon: "dumbbell" },
    { id: "evolucao", href: "/evolucao", label: "Evolução", icon: "chart" },
    { id: "perfil", href: "/perfil", label: "Perfil", icon: "person" },
];

/** Room under a screen's content for the navbar: 34 + 68 + 32px. */
export const NAV_CLEARANCE = "pb-[calc(max(34px,env(safe-area-inset-bottom))+100px)]";

export function AppNav({ active }: { active: Tab }) {
    return (
        <ViewTransition name="vita-bar">
            <nav
                aria-label="Navegação principal"
                className="glass fixed inset-x-margin bottom-[max(34px,env(safe-area-inset-bottom))] z-20 mx-auto h-[68px] max-w-md rounded-[20px]"
            >
                <ul className="grid h-full grid-cols-4">
                    {tabs.map((tab) => {
                        const current = tab.id === active;
                        return (
                            <li key={tab.id} className="flex">
                                <Link
                                    href={tab.href}
                                    aria-current={current ? "page" : undefined}
                                    className={cx(
                                        "pressable focus-ring flex flex-1 flex-col items-center justify-center gap-1 rounded-[20px] pb-2",
                                        current ? "text-ink" : "text-secondary",
                                    )}
                                >
                                    <Icon name={tab.icon} size={24} />
                                    <span
                                        className={cx(
                                            "relative text-11 leading-none",
                                            current ? "strong" : "font-semibold",
                                        )}
                                    >
                                        {tab.label}
                                        {current ? (
                                            <span
                                                aria-hidden
                                                className="absolute left-1/2 top-[calc(100%+6px)] size-1 -translate-x-1/2 rounded-full bg-accent"
                                            />
                                        ) : null}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </ViewTransition>
    );
}
