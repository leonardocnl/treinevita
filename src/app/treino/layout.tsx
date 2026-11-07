import { ExerciseList } from "./_components/exercise-list";
import { loadOpenWorkout } from "./_components/load-workout";

/**
 * Workout area. On desktop the exercise list stays on the left and the
 * exercise in focus on the right; on the phone each one is a full screen.
 */
export default async function WorkoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const workout = await loadOpenWorkout();
    return (
        <div className="mx-auto w-full max-w-6xl md:grid md:grid-cols-[minmax(320px,380px)_1fr] md:gap-8 md:px-8">
            <aside aria-label="Exercícios do treino" className="hidden md:block md:pt-14">
                <div className="sticky top-8 flex flex-col gap-4">
                    <h2 className="numeric px-1 text-[28px] font-extrabold">
                        Treino {workout.label}
                    </h2>
                    <ExerciseList workout={workout} />
                </div>
            </aside>
            <div className="min-w-0">{children}</div>
        </div>
    );
}
