import { Title } from "@/shared/ui/text";

import { ExerciseList } from "./_components/exercise-list";
import { loadOpenWorkout } from "./_components/load-workout";

/**
 * Workout area. On desktop the exercise list stays on the left and the
 * exercise in focus on the right; on the phone each one is a full screen.
 */
export default async function WorkoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const workout = await loadOpenWorkout();
    return (
        <div className="mx-auto w-full max-w-6xl md:grid md:grid-cols-[minmax(300px,360px)_1fr] md:gap-14 md:px-10">
            <aside aria-label="Exercícios do treino" className="hidden md:block md:pt-16">
                <div className="sticky top-10">
                    <Title as="h2" size={28} weight="normal">
                        Treino {workout.label}
                    </Title>
                    <div className="mt-6">
                        <ExerciseList workout={workout} />
                    </div>
                </div>
            </aside>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
