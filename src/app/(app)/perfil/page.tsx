import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getProfile } from "@/modules/identity";
import { getWeightTrend } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { getWeeklyGoal } from "@/modules/training";

import { AppNav } from "../../_components/app-nav";

import { Profile } from "./profile";

export const metadata: Metadata = { title: "Perfil · VITA" };

export default async function ProfilePage() {
    const context = await requireAppContext();
    const [profile, weeklyGoal, weight] = await Promise.all([
        getProfile(context),
        getWeeklyGoal(context),
        getWeightTrend(context),
    ]);
    if (!profile) {
        redirect("/comecar");
    }
    return (
        <>
            <Profile profile={{ ...profile, weeklyGoal }} weightTrend={weight?.trend ?? []} />
            <AppNav active="perfil" />
        </>
    );
}
