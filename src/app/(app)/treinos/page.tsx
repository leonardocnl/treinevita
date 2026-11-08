import type { Metadata } from "next";

import { ComingSoon } from "../../_components/coming-soon";
import { requireAppContext } from "@/modules/tenancy";

export const metadata: Metadata = { title: "Treinos · VITA" };

export default async function Page() {
    await requireAppContext();
    return (
        <ComingSoon
            tab="treinos"
            title="Treinos"
            text="Aqui você vai montar e editar a ficha. Chega na próxima fase."
        />
    );
}
