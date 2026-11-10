import type { Metadata } from "next";

import { IconButton } from "@/shared/ui/icon-button";

export const metadata: Metadata = { title: "Créditos · VITA" };

const link = "font-semibold text-ink underline decoration-hairline underline-offset-4";

/** Attribution required by CC BY-SA 4.0 for the exercise drawings. */
export default function CreditsPage() {
    return (
        <main className="mx-auto w-full max-w-md px-margin pb-24 pt-top">
            <IconButton icon="chevron-left" href="/ajustes" aria-label="Voltar aos Ajustes" />
            <h1 className="headline text-34 mt-intro">Créditos</h1>
            <div className="mt-intro flex flex-col gap-label">
                <p className="text-17">
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
                </p>
                <p className="text-17 text-secondary">
                    Os desenhos foram adaptados para o VITA: as cores mudam com o tema do app. Os
                    desenhos adaptados seguem sob a mesma licença, CC BY-SA 4.0.
                </p>
            </div>
        </main>
    );
}
