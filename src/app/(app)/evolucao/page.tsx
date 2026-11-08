import type { Metadata } from "next";

import { ComingSoon } from "../../_components/coming-soon";
import { requireAppContext } from "@/modules/tenancy";

export const metadata: Metadata = { title: "Evolução · VITA" };

export default async function Page() {
    await requireAppContext();
    return (
        <ComingSoon
            tab="evolucao"
            title="Evolução"
            text="Gráficos por exercício, volume por músculo, recordes e estagnação. Chega na fase 3."
        />
    );
}
