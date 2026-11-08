import type { Metadata } from "next";

import { isDevSignInAvailable } from "@/modules/identity";
import { Icon } from "@/shared/ui/icons";
import { PillAction } from "@/shared/ui/pill-action";
import { Label, Title } from "@/shared/ui/text";
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
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-between px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-[max(env(safe-area-inset-top),64px)]">
            <Wordmark />

            <div className="flex flex-col gap-10">
                <div>
                    <Title size={40} weight="light" leading="1.08">
                        Seus treinos, sua evolução.
                    </Title>
                    <Label size={17} tone="secondary" className="mt-4">
                        Registre cada série em segundos e veja o quanto você evoluiu.
                    </Label>
                </div>

                {message ? (
                    <Label role="alert" tone="accent">
                        {message}
                    </Label>
                ) : null}

                <div className="flex flex-col gap-3">
                    {/* A native GET form, not a <Link>: prefetching would start the OAuth flow. */}
                    <form action="/api/auth/google" method="get">
                        <PillAction type="submit" icon={<Icon name="arrow-right" size={20} />}>
                            Entrar com Google
                        </PillAction>
                    </form>
                    {devAvailable ? (
                        <form action={devSignInAction}>
                            <PillAction type="submit" icon={<Icon name="arrow-right" size={20} />}>
                                Entrar como Leonardo
                            </PillAction>
                        </form>
                    ) : null}
                </div>
            </div>
        </main>
    );
}
