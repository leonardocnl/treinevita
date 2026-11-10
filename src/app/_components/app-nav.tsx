/*
 * AppNav: the glass navbar of the main screens. Floating 20px from the sides
 * and 34px from the bottom (or the safe area), 68px high, a pill, clear glass
 * (paper at 35% with a 12px blur), no border or shadow. Four equal slots, each a 24px
 * dot-matrix icon (9×9, Doto style), 6px over an 11px label at 600. Sized for
 * 3× screens (iPhone): a cell is 8 device pixels and a dot 6 (r 0.375), each
 * centered on a whole pixel, so the dots stay sharp. Inactive: secondary.
 * Active: the icon in ink and bold (dots of r 0.4375, 7 device pixels), the
 * dots lighting up in a ~110ms diagonal sweep, and the label in accent red. The label never
 * changes weight, so the bar does not shift. The bar keeps one view
 * transition name, so switching tabs crossfades the icon states in place.
 */
import Link from "next/link";
import { ViewTransition, type CSSProperties } from "react";

import { cx } from "@/shared/ui/cx";

export type Tab = "resumo" | "treinos" | "evolucao" | "perfil";

/** 9×9 glyphs, one string per row: "#" is a dot, "." an empty cell. */
const glyphs: Record<Tab, string> = {
    resumo: ".##...##. #..#.#..# #..#.#..# .##...##. ......... .##...##. #..#.#..# #..#.#..# .##...##.",
    treinos:
        ".#.....#. ##.....## ##.....## ##.....## ######### ##.....## ##.....## ##.....## .#.....#.",
    evolucao:
        "......##. ......##. ...##.##. ...##.##. ##.##.##. ##.##.##. ##.##.##. ##.##.##. ##.##.##.",
    perfil: "...###... ..#####.. ..#####.. ..#####.. ...###... ......... ..#####.. .#######. #########",
};

const tabs: { id: Tab; href: string; label: string }[] = [
    { id: "resumo", href: "/", label: "Resumo" },
    { id: "treinos", href: "/treinos", label: "Treinos" },
    { id: "evolucao", href: "/evolucao", label: "Evolução" },
    { id: "perfil", href: "/perfil", label: "Perfil" },
];

/** A 24px dot-matrix icon; when `active`, the dots are bolder and light up along the diagonal. */
function DotIcon({ glyph, active }: { glyph: string; active: boolean }) {
    return (
        <svg width={24} height={24} viewBox="0 0 9 9" fill="currentColor" aria-hidden>
            {glyph
                .split(" ")
                .flatMap((row, y) =>
                    [...row].map((cell, x) =>
                        cell === "#" ? (
                            <circle
                                key={`${x}-${y}`}
                                cx={x + 0.5}
                                cy={y + 0.5}
                                r={active ? 0.4375 : 0.375}
                                className={active ? "light-up" : undefined}
                                style={
                                    active
                                        ? ({ "--order": Math.floor((x + y) / 3) } as CSSProperties)
                                        : undefined
                                }
                            />
                        ) : null,
                    ),
                )}
        </svg>
    );
}

/** Room under a screen's content for the navbar: 34 + 68 + 32px. */
export const NAV_CLEARANCE = "pb-[calc(max(34px,env(safe-area-inset-bottom))+100px)]";

export function AppNav({ active }: { active: Tab }) {
    return (
        <ViewTransition name="vita-bar">
            <nav
                aria-label="Navegação principal"
                className="glass-clear fixed inset-x-margin bottom-[max(34px,env(safe-area-inset-bottom))] z-20 mx-auto h-[68px] max-w-md rounded-full"
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
                                        "pressable focus-ring flex flex-1 flex-col items-center justify-center gap-1.5 rounded-full",
                                        current ? "text-ink" : "text-secondary",
                                    )}
                                >
                                    <DotIcon glyph={glyphs[tab.id]} active={current} />
                                    <span
                                        className={cx(
                                            "text-11 font-semibold leading-none",
                                            current && "text-accent",
                                        )}
                                    >
                                        {tab.label}
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
