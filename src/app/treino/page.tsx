import type { Metadata } from "next";

import { loadOpenWorkout } from "./_components/load-workout";
import { WorkoutScreens } from "./_components/workout-screens";

export const metadata: Metadata = { title: "Treino · VITA" };

export default async function WorkoutPage() {
    const workout = await loadOpenWorkout("/treino");
    return <WorkoutScreens key={workout.sessionId} workout={workout} />;
}
