import "server-only";

import { redirect } from "next/navigation";

import { getOpenSession } from "@/modules/logging";
import { getWorkoutView, type ExerciseView } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { formatDuration, formatNumber } from "@/shared/format/numbers";

/** Loads the workout in progress, or sends back to the Summary when there is none. */
export async function loadOpenWorkout() {
    const context = await requireAppContext();
    const session = await getOpenSession(context);
    if (!session) {
        redirect("/");
    }
    return getWorkoutView(context, session);
}

export function prescriptionText(exercise: ExerciseView): string {
    if (exercise.measurement === "duration") {
        const min = exercise.durationMinSeconds ?? 30;
        const max = exercise.durationMaxSeconds ?? min;
        return `${exercise.targetSets} séries de ${min} a ${max} segundos`;
    }
    if (
        exercise.repMin !== null &&
        exercise.repMax !== null &&
        exercise.repMin !== exercise.repMax
    ) {
        return `${exercise.targetSets} séries de ${exercise.repMin} a ${exercise.repMax}`;
    }
    return `${exercise.targetSets} séries de ${exercise.repMax ?? exercise.repMin ?? 10}`;
}

export function lastTimeText(exercise: ExerciseView): string | null {
    const last = exercise.lastTime;
    if (!last || last.sets.length === 0) {
        return null;
    }
    if (exercise.measurement === "duration") {
        const durations = last.sets.map((set) => formatDuration(set.durationSeconds ?? 0));
        return `Última vez, ${durations.join(", ")}`;
    }
    const loads = new Set(last.sets.map((set) => set.loadKg));
    const reps = last.sets.map((set) => set.reps ?? 0);
    if (loads.size === 1) {
        const allSame = reps.every((value) => value === reps[0]);
        const repsText = allSame ? `${reps[0]} nas ${reps.length} séries` : reps.join(", ");
        return `Última vez, ${formatNumber(last.sets[0].loadKg ?? 0)} kg × ${repsText}`;
    }
    return `Última vez, ${last.sets.map((set) => `${formatNumber(set.loadKg ?? 0)} × ${set.reps ?? 0}`).join(", ")}`;
}

export function askText(exercise: ExerciseView): string | null {
    const decision = exercise.decision;
    if (!decision || decision.kind !== "ask" || exercise.doneSets.length > 0) {
        return null;
    }
    if (decision.reason === "below_range") {
        return `Na última vez uma série ficou abaixo de ${exercise.repMin}. Mantive ${formatNumber(decision.loadKg)} kg.`;
    }
    return `Na última vez a carga variou. Comecei em ${formatNumber(decision.loadKg)} kg.`;
}
