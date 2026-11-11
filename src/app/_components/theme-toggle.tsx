"use client";

/*
 * The theme toggle at the top right, after the one in the owner's notfolio:
 * a sun in light mode and a moon in dark mode; a tap spins the icon once
 * while it swaps, and on a mouse it leans 20° and grows a little on hover.
 * Rebuilt with VITA's tokens; only transform and opacity move.
 *
 * The switch is instant: every CSS transition is off for one frame (the
 * theme-switching class in globals.css) and nothing goes through a React
 * transition, so no View Transition snapshots the screen. A server action
 * would refresh the router inside a transition and start one: on iPhone
 * Safari that snapshot drops the navbar glass's rounded clip and flashes a
 * gray rectangle. So the cookie is written by a plain fetch instead.
 */
import { useState } from "react";

import { parseTheme, toggledTheme } from "@/shared/theme/theme";
import { IconButton } from "@/shared/ui/icon-button";
import { Icon } from "@/shared/ui/icons";

function applyTheme(theme: "light" | "dark") {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.dataset.theme = theme;
    // Resolves the new colors now, while transitions are still off.
    const canvas = getComputedStyle(document.body).backgroundColor;
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
        meta.content = canvas;
    }
    // Back on after the first frame painted with the new theme.
    requestAnimationFrame(() =>
        requestAnimationFrame(() => root.classList.remove("theme-switching")),
    );
}

export function ThemeToggle() {
    const [spins, setSpins] = useState(0);

    function toggle() {
        const next = toggledTheme(
            parseTheme(document.documentElement.dataset.theme),
            window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
        applyTheme(next);
        setSpins((count) => count + 1);
        // Best effort: the screen already shows the theme; a failure only loses it on reload.
        void fetch("/api/theme", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ theme: next }),
        }).catch(() => undefined);
    }

    return (
        <IconButton onClick={toggle} aria-label="Alternar tema claro e escuro" className="group">
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
        </IconButton>
    );
}
