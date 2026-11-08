/*
 * The bottom bar with tabs: each tab is an icon with its name in 11px under it,
 * in equal columns inside the floating bar and, at the end, room for the
 * screen's main action. The active tab is ink, the others ink-secondary; both
 * use the same weight, so switching never shifts the layout. Between tabs the
 * floating bar crossfades (it has its own view transition name), so the icon
 * state crossfades too; the active tab also fades in on its own.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { FloatBar } from "./float-bar";
import { Icon, type IconName } from "./icons";

export type TabBarItem = {
    href: string;
    label: string;
    icon: IconName;
    current?: boolean;
};

type TabBarProps = {
    tabs: readonly TabBarItem[];
    /** Names the navigation for screen readers. */
    label: string;
    /** The screen's main action (a RoundAction), after the tabs. */
    action?: ReactNode;
};

export function TabBar({ tabs, label, action }: TabBarProps) {
    return (
        <FloatBar>
            <nav aria-label={label} className="h-12 flex-1">
                <ul
                    className="grid h-full"
                    style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
                >
                    {tabs.map((tab) => (
                        <li key={tab.href} className="flex">
                            <Link
                                href={tab.href}
                                aria-current={tab.current ? "page" : undefined}
                                className={`pressable flex flex-1 flex-col items-center justify-center gap-0.5 ${
                                    tab.current ? "text-ink" : "text-ink-secondary"
                                }`}
                            >
                                <span className={tab.current ? "fade-in" : undefined}>
                                    <Icon name={tab.icon} size={22} />
                                </span>
                                <span
                                    className={`text-[11px] font-normal leading-none ${tab.current ? "fade-in" : ""}`}
                                >
                                    {tab.label}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            {action}
        </FloatBar>
    );
}
