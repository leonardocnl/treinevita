import type { ReactNode } from "react";

import type { IconName } from "@/shared/ui/icons";
import { TabBar } from "@/shared/ui/tab-bar";

export type Tab = "resumo" | "treinos" | "evolucao" | "perfil";

const tabs: { id: Tab; href: string; label: string; icon: IconName }[] = [
    { id: "resumo", href: "/", label: "Resumo", icon: "summary" },
    { id: "treinos", href: "/treinos", label: "Treinos", icon: "dumbbell" },
    { id: "evolucao", href: "/evolucao", label: "Evolução", icon: "chart" },
    { id: "perfil", href: "/perfil", label: "Perfil", icon: "person" },
];

/** The app's bottom bar: the four main tabs and, at the end, the screen's main action. */
export function AppDock({ active, action }: { active: Tab; action?: ReactNode }) {
    return (
        <TabBar
            label="Navegação principal"
            tabs={tabs.map((tab) => ({ ...tab, current: tab.id === active }))}
            action={action}
        />
    );
}
