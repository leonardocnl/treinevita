"use client";

/*
 * The theme toggle at the top right, after the one in the owner's notfolio:
 * a sun in light mode and a moon in dark mode; a tap spins the icon once
 * while it swaps, and on a mouse it leans 20° and grows a little on hover.
 * Rebuilt with VITA's tokens; only transform and opacity move. It flips what
 * is shown at once, then writes the same vita_theme cookie as Ajustes.
 */
import { useState, useTransition } from "react";

import { parseTheme, toggledTheme } from "@/shared/theme/theme";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";

import { setThemeAction } from "./profile-actions";

export function ThemeToggle() {
    const [spins, setSpins] = useState(0);
    const [, startTransition] = useTransition();

    function toggle() {
        const root = document.documentElement;
        const next = toggledTheme(
            parseTheme(root.dataset.theme),
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
        root.dataset.theme = next;
        setSpins((count) => count + 1);
        startTransition(() => setThemeAction(next));
    }

    return (
        <GlassIconButton
            onClick={toggle}
            aria-label="Alternar tema claro e escuro"
            className="group"
        >
            {/* The key restarts the spin on every tap. */}
            <span key={spins} className={spins > 0 ? "spin-once block" : "block"}>
                <span className="relative block size-5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[20deg] group-hover:scale-115">
                    <span className="absolute inset-0 opacity-100 transition-opacity duration-(--vita-duration-snappy) ease-snappy dark:opacity-0">
                        <Icon name="sun" size={20} />
                    </span>
                    <span className="absolute inset-0 opacity-0 transition-opacity duration-(--vita-duration-snappy) ease-snappy dark:opacity-100">
                        <Icon name="moon" size={20} />
                    </span>
                </span>
            </span>
        </GlassIconButton>
    );
}
