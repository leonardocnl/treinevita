import { headers } from "next/headers";
import type { ReactNode } from "react";

import { Wordmark } from "@/shared/ui/wordmark";

/**
 * From 1024px the app is not ready yet: a calm notice replaces it. A CSS
 * breakpoint, not user-agent sniffing, so tablets and phones below 1024px
 * are untouched. The sign-in screen does not use this gate.
 */
export async function DesktopGate({ children }: { children: ReactNode }) {
    const host = (await headers()).get("host");
    return (
        <>
            <div className="lg:hidden">{children}</div>
            <main className="hidden min-h-dvh flex-col justify-between p-16 lg:flex">
                <Wordmark label="VITA" />
                <div className="max-w-md">
                    <p className="headline text-34">A versão para computador está em construção.</p>
                    <p className="text-17 text-secondary mt-label">
                        Por enquanto, use o VITA no celular.
                    </p>
                    {host ? <p className="text-17 font-semibold mt-inner">{host}</p> : null}
                </div>
            </main>
        </>
    );
}
