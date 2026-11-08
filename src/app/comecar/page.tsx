import type { Metadata } from "next";

import { listGlobalExercises } from "@/modules/catalog";
import { requireOnboardingContext } from "@/modules/tenancy";
import { TEMPLATES, getActiveProgram, getWeeklyGoal } from "@/modules/training";

import { DesktopGate } from "../_components/desktop-gate";

import { Onboarding } from "./onboarding";

export const metadata: Metadata = { title: "Começar · VITA" };

/** The onboarding: one short question per screen, saved all at once at the end. */
export default async function OnboardingPage() {
    const context = await requireOnboardingContext();
    const [program, catalog, weeklyGoal] = await Promise.all([
        getActiveProgram(context),
        listGlobalExercises(),
        getWeeklyGoal(context),
    ]);

    return (
        <DesktopGate>
            <Onboarding
                initialName={(context.displayName ?? "").slice(0, 40)}
                initialWeeklyGoal={weeklyGoal}
                currentProgram={
                    program
                        ? program.workouts.map((workout) => ({
                              label: workout.label,
                              exercises: workout.exercises.map((exercise) => exercise.name),
                          }))
                        : null
                }
                templates={Object.values(TEMPLATES)}
                catalog={catalog}
            />
        </DesktopGate>
    );
}
