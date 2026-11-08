import type { Metadata } from "next";
import { cookies } from "next/headers";

import { requireAppContext } from "@/modules/tenancy";
import { THEME_COOKIE, parseTheme } from "@/shared/theme/theme";

import { Settings } from "./settings";

export const metadata: Metadata = { title: "Ajustes · VITA" };

export default async function SettingsPage() {
    const [context, cookieStore] = await Promise.all([requireAppContext(), cookies()]);
    return (
        <Settings theme={parseTheme(cookieStore.get(THEME_COOKIE)?.value)} email={context.email} />
    );
}
