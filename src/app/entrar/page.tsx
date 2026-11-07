import type { Metadata } from "next";

import { isDevSignInAvailable } from "@/modules/identity";
import { ArrowRightIcon } from "@/shared/ui/icons";

import { devSignInAction } from "../_components/actions";
import { PillActionContent, pillActionClass } from "../_components/primary-action";

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
            <p className="num text-[20px]">vita</p>

            <div className="flex flex-col gap-10">
                <div>
                    <h1 className="text-[40px] font-light leading-[1.08]">
                        Seus treinos, sua evolução.
                    </h1>
                    <p className="mt-4 text-[17px] text-ink-secondary">
                        Registre cada série em segundos e veja o quanto você evoluiu.
                    </p>
                </div>

                {message ? (
                    <p role="alert" className="text-[15px] text-red-text">
                        {message}
                    </p>
                ) : null}

                <div className="flex flex-col gap-3">
                    {/* A plain link, not <Link>: prefetching would start the OAuth flow. */}
                    <a href="/api/auth/google" className={pillActionClass}>
                        <PillActionContent icon={<ArrowRightIcon size={20} />}>
                            Entrar com Google
                        </PillActionContent>
                    </a>
                    {devAvailable ? (
                        <form action={devSignInAction}>
                            <button type="submit" className={pillActionClass}>
                                <PillActionContent icon={<ArrowRightIcon size={20} />}>
                                    Entrar como Leonardo
                                </PillActionContent>
                            </button>
                        </form>
                    ) : null}
                </div>
            </div>
        </main>
    );
}
