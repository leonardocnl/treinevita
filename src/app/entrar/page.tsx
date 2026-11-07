import type { Metadata } from "next";

import { isDevSignInAvailable } from "@/modules/identity";

import { devSignInAction } from "../_components/actions";
import { PrimaryActionContent, primaryActionClass } from "../_components/primary-action";

export const metadata: Metadata = { title: "Entrar · VITA" };

const errors: Record<string, string> = {
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
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-end gap-8 px-6 pb-[max(env(safe-area-inset-bottom),32px)]">
            <div className="flex flex-col gap-3">
                <h1 className="numeric text-6xl font-extrabold">VITA</h1>
                <p className="text-[17px] text-ink-secondary">Seus treinos, sua evolução.</p>
            </div>

            {message ? (
                <p role="alert" className="text-[15px] text-red-text">
                    {message}
                </p>
            ) : null}

            <div className="glass rounded-surface p-2">
                {devAvailable ? (
                    <form action={devSignInAction}>
                        <button type="submit" className={primaryActionClass}>
                            <PrimaryActionContent
                                title="Entrar como Leonardo"
                                subtitle="Atalho de desenvolvimento"
                            />
                        </button>
                    </form>
                ) : (
                    <button type="button" disabled className={primaryActionClass}>
                        <PrimaryActionContent
                            title="Entrar com Google"
                            subtitle="Chega na fase 1"
                        />
                    </button>
                )}
            </div>
        </main>
    );
}
