import { AppDock } from "./app-dock";

type Tab = "treinos" | "evolucao" | "corpo";

/** Placeholder for tabs that arrive in the next phases. */
export function ComingSoon({ tab, title, text }: { tab: Tab; title: string; text: string }) {
    return (
        <>
            <main className="mx-auto w-full max-w-5xl px-6 pb-48 pt-[max(env(safe-area-inset-top),56px)] md:px-8">
                <h1 className="text-[34px] font-bold leading-tight">{title}</h1>
                <p className="mt-2 max-w-sm text-[17px] text-ink-secondary">{text}</p>
            </main>
            <AppDock active={tab} />
        </>
    );
}
