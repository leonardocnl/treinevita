import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAvatarVersion, getProfile } from "@/modules/identity";
import { requireAppContext } from "@/modules/tenancy";
import { getActiveProgram, getWeeklyGoal, programRest } from "@/modules/training";

import { AppNav } from "../../_components/app-nav";

import { Profile } from "./profile";

export const metadata: Metadata = { title: "Perfil · VITA" };

export default async function ProfilePage() {
    const context = await requireAppContext();
    const [profile, weeklyGoal, program, avatarVersion] = await Promise.all([
        getProfile(context),
        getWeeklyGoal(context),
        getActiveProgram(context),
        getAvatarVersion(context),
    ]);
    if (!profile) {
        redirect("/comecar");
    }
    return (
        <>
            <Profile
                profile={{ ...profile, weeklyGoal }}
                cycle={program && program.workouts.length > 0 ? program.workouts.length : null}
                restSeconds={program ? programRest(program) : null}
                avatarVersion={avatarVersion?.getTime() ?? null}
            />
            <AppNav active="perfil" />
        </>
    );
}
