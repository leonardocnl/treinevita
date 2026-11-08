/*
 * The bottom bar with tabs: text tabs in equal columns inside the floating bar
 * and, at the end, room for the screen's main action.
 */
import Link from "next/link";
import type { ReactNode } from "react";

import { FloatBar } from "./float-bar";

export type TabBarItem = {
    href: string;
    label: string;
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
                                className={`pressable flex flex-1 items-center justify-center text-[13px] transition-colors ${
                                    tab.current
                                        ? "font-medium text-ink"
                                        : "text-ink-secondary hover:text-ink"
                                }`}
                            >
                                {tab.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
            {action}
        </FloatBar>
    );
}
