import { headers } from "next/headers";
import type { ReactNode } from "react";

import { Label, Title } from "@/shared/ui/text";
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
                    <Title as="p" size={40} weight="light" leading="1.08">
                        A versão para computador está em construção.
                    </Title>
                    <Label size={17} tone="secondary" className="mt-4">
                        Por enquanto, use o VITA no celular.
                    </Label>
                    {host ? (
                        <Label size={17} weight="normal" className="mt-1">
                            {host}
                        </Label>
                    ) : null}
                </div>
            </main>
        </>
    );
}
