import { Label, Title } from "@/shared/ui/text";

import { AppDock, type Tab } from "./app-dock";

/** Placeholder for tabs that arrive in the next phases. */
export function ComingSoon({
    tab,
    title,
    text,
}: {
    tab: Exclude<Tab, "resumo" | "perfil">;
    title: string;
    text: string;
}) {
    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-6 pb-48 pt-[max(env(safe-area-inset-top),56px)] md:px-8">
                <Title size={34} weight="normal" leading="tight">
                    {title}
                </Title>
                <Label size={17} tone="secondary" className="mt-2 max-w-sm">
                    {text}
                </Label>
            </main>
            <AppDock active={tab} />
        </>
    );
}
