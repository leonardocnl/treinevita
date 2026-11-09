import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadOpenWorkout } from "../_components/load-workout";
import { WorkoutScreens } from "../_components/workout-screens";

export const metadata: Metadata = { title: "Exercício · VITA" };

/**
 * Focus screen of one exercise, opened by URL (refresh, a shared link). The URL
 * carries only its position in the workout (1 to 8), never an id: the data always
 * comes from the person's own open session. Inside the workout, moving between
 * exercises happens on the client (workout-screens.tsx).
 */
export default async function ExercisePage({ params }: { params: Promise<{ posicao: string }> }) {
    const { posicao } = await params;
    const position = Number(posicao);
    const workout = await loadOpenWorkout("/treino/[posicao]");
    if (!Number.isInteger(position) || position < 1 || position > workout.exercises.length) {
        notFound();
    }
    return <WorkoutScreens key={workout.sessionId} workout={workout} />;
}
