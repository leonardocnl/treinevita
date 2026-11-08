import type { ReactNode } from "react";

import { TabBar } from "@/shared/ui/tab-bar";

type Tab = "resumo" | "treinos" | "evolucao" | "corpo";

const tabs: { id: Tab; href: string; label: string }[] = [
    { id: "resumo", href: "/", label: "Resumo" },
    { id: "treinos", href: "/treinos", label: "Treinos" },
    { id: "evolucao", href: "/evolucao", label: "Evolução" },
    { id: "corpo", href: "/corpo", label: "Corpo" },
];

/** The app's bottom bar: the four main tabs and, at the end, the screen's main action. */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    return (
        <TabBar
            label="Navegação principal"
            tabs={tabs.map((tab) => ({
                href: tab.href,
                label: tab.label,
                current: tab.id === active,
            }))}
            action={action}
        />
    );
}
