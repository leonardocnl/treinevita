import type { Metadata } from "next";

import { ComingSoon } from "../../_components/coming-soon";
import { requireAppContext } from "@/modules/tenancy";

export const metadata: Metadata = { title: "Corpo · VITA" };

export default async function Page() {
    await requireAppContext();
    return (
        <ComingSoon
            tab="corpo"
            title="Corpo"
            text="Peso, cintura e outras medidas. Chega na fase 3."
        />
    );
}
