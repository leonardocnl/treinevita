import type { Metadata } from "next";

import { IconButton } from "@/shared/ui/icon-button";
import { Label, Title } from "@/shared/ui/text";

export const metadata: Metadata = { title: "Créditos · VITA" };

const link = "font-normal text-ink underline decoration-hairline underline-offset-4";

/** Attribution required by CC BY-SA 4.0 for the exercise drawings. */
export default function CreditsPage() {
    return (
        <main className="mx-auto w-full max-w-md px-6 pb-24 pt-[max(env(safe-area-inset-top),52px)]">
            <IconButton icon="chevron-left" href="/ajustes" aria-label="Voltar aos Ajustes" />
            <Title size={34} weight="normal" leading="tight" className="mt-6">
                Créditos
            </Title>
            <div className="mt-6 flex flex-col gap-4">
                <Label size={17}>
                    As ilustrações dos exercícios vêm do{" "}
                    <a href="https://github.com/everkinetic/data" className={link}>
                        Everkinetic
                    </a>
                    , publicadas sob a licença{" "}
                    <a
                        href="https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br"
                        className={link}
                    >
                        CC BY-SA 4.0
                    </a>
                    .
                </Label>
                <Label size={17} tone="secondary">
                    Os desenhos foram adaptados para o VITA: as cores mudam com o tema do app. Os
                    desenhos adaptados seguem sob a mesma licença, CC BY-SA 4.0.
                </Label>
            </div>
        </main>
    );
}
