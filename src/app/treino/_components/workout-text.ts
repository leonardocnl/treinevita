/* Sentences of the workout screens: prescription, last time and the progression question. */
import { formatDuration, formatNumber } from "@/shared/format/numbers";

import type { WorkoutExercise } from "./workout-state";

export function prescriptionText(exercise: WorkoutExercise): string {
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

export function lastTimeText(exercise: WorkoutExercise): string | null {
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

export function askText(exercise: WorkoutExercise): string | null {
    const decision = exercise.decision;
    if (!decision || decision.kind !== "ask" || exercise.doneSets.length > 0) {
        return null;
    }
    if (decision.reason === "below_range") {
        return `Na última vez uma série ficou abaixo de ${exercise.repMin}. Mantive ${formatNumber(decision.loadKg)} kg.`;
    }
    return `Na última vez a carga variou. Comecei em ${formatNumber(decision.loadKg)} kg.`;
}
