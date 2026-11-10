import { AppNav, NAV_CLEARANCE, type Tab } from "./app-nav";
import { ThemeToggle } from "./theme-toggle";
import { TopBar } from "./top-bar";

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
            <main className={`pt-top mx-auto w-full max-w-md px-margin ${NAV_CLEARANCE}`}>
                <TopBar>
                    <ThemeToggle />
                </TopBar>
                <h1 className="headline mt-intro text-34">{title}</h1>
                <p className="mt-intro text-17 text-secondary">{text}</p>
            </main>
            <AppNav active={tab} />
        </>
    );
}
