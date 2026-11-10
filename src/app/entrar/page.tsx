import type { Metadata } from "next";

import { isDevSignInAvailable } from "@/modules/identity";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Wordmark } from "@/shared/ui/wordmark";

import { devSignInAction } from "../_components/actions";

export const metadata: Metadata = { title: "Entrar · VITA" };

const errors: Record<string, string> = {
    acesso: "Essa conta não tem acesso ao VITA.",
    google: "Não deu para entrar. Tente de novo.",
    banco: "O banco local está vazio. Rode npm run db:local:reset e tente de novo.",
    indisponivel: "Esse atalho só existe em desenvolvimento, com o banco local.",
};

export default async function SignInPage({
    searchParams,
}: {
    searchParams: Promise<{ erro?: string }>;
}) {
    const { erro } = await searchParams;
    const devAvailable = isDevSignInAvailable();
    const message = erro ? errors[erro] : undefined;

    return (
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-margin pb-[max(env(safe-area-inset-bottom),24px)] pt-top">
            <Wordmark />

            <div className="flex flex-col gap-10">
                <div>
                    <h1 className="headline text-34">Seus treinos, sua evolução.</h1>
                    <p className="text-17 text-secondary mt-label">
                        Registre cada série em segundos e veja o quanto você evoluiu.
                    </p>
                </div>

                {message ? (
                    <p className="text-15 font-semibold" role="alert">
                        {message}
                    </p>
                ) : null}

                <div className="flex flex-col gap-gutter">
                    {/* A native GET form, not a <Link>: prefetching would start the OAuth flow. */}
                    <form action="/api/auth/google" method="get">
                        <PrimaryAction type="submit" glyph="arrow" label="Entrar com Google" />
                    </form>
                    {devAvailable ? (
                        <form action={devSignInAction}>
                            <PrimaryAction
                                type="submit"
                                glyph="arrow"
                                label="Entrar como Leonardo"
                            />
                        </form>
                    ) : null}
                </div>
            </div>
        </main>
    );
}
