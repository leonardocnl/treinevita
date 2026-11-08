import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getProfile } from "@/modules/identity";
import { requireAppContext } from "@/modules/tenancy";
import { getWeeklyGoal } from "@/modules/training";
import { THEME_COOKIE, parseTheme } from "@/shared/theme/theme";

import { Settings } from "./settings";

export const metadata: Metadata = { title: "Ajustes · VITA" };

export default async function SettingsPage() {
    const context = await requireAppContext();
    const [profile, weeklyGoal, cookieStore] = await Promise.all([
        getProfile(context),
        getWeeklyGoal(context),
        cookies(),
    ]);
    if (!profile) {
        redirect("/comecar");
    }
    return (
        <Settings
            profile={{ ...profile, weeklyGoal }}
            theme={parseTheme(cookieStore.get(THEME_COOKIE)?.value)}
            email={context.email}
        />
    );
}
