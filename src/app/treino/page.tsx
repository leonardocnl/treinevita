import type { Metadata } from "next";
import Link from "next/link";

import { ChevronLeftIcon } from "@/shared/ui/icons";

import { discardWorkoutAction, finishWorkoutAction } from "../_components/actions";
import { PrimaryActionContent, primaryActionClass } from "../_components/primary-action";

import { ExerciseList } from "./_components/exercise-list";
import { loadOpenWorkout } from "./_components/load-workout";

export const metadata: Metadata = { title: "Treino · VITA" };

export default async function WorkoutPage() {
    const workout = await loadOpenWorkout();
    const doneExercises = workout.exercises.filter(
        (exercise) => exercise.doneSets.length >= exercise.targetSets,
    ).length;
    const minutes = Math.max(1, Math.round((Date.now() - workout.startedAt.getTime()) / 60000));

    return (
        <>
            <main className="px-4 pb-48 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pt-14">
                <div className="flex items-center justify-between md:hidden">
                    <Link
                        href="/"
                        aria-label="Voltar ao Resumo"
                        className="glass pressable flex size-11 items-center justify-center rounded-full"
                    >
                        <ChevronLeftIcon size={22} />
                    </Link>
                    <span className="text-[15px] text-ink-secondary">{minutes} min</span>
                </div>

                <header className="mt-5 flex flex-col gap-1 px-2 md:hidden">
                    <h1 className="numeric text-[34px] font-extrabold leading-tight">
                        Treino {workout.label}
                    </h1>
                    <p className="text-[15px] text-ink-secondary">
                        {doneExercises} de {workout.exercises.length} exercícios concluídos
                    </p>
                </header>

                <div className="mt-6 md:hidden">
                    <ExerciseList workout={workout} />
                </div>

                <div className="hidden min-h-[60vh] flex-col justify-center gap-2 md:flex">
                    <h1 className="text-[28px] font-bold">Escolha um exercício</h1>
                    <p className="text-[17px] text-ink-secondary">
                        {doneExercises} de {workout.exercises.length} concluídos, {minutes} min de
                        treino.
                    </p>
                </div>

                <form action={discardWorkoutAction} className="mt-8 px-2">
                    <button
                        type="submit"
                        className="pressable text-[15px] font-semibold text-red-text"
                    >
                        Descartar treino
                    </button>
                </form>
            </main>

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),14px)]">
                <div className="glass pointer-events-auto w-full max-w-md rounded-surface p-2">
                    <form action={finishWorkoutAction}>
                        <button type="submit" className={primaryActionClass}>
                            <PrimaryActionContent
                                title="Finalizar treino"
                                subtitle={`${doneExercises} de ${workout.exercises.length} exercícios`}
                            />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
