import type { Metadata } from "next";
import Link from "next/link";

import { CheckIcon, ChevronLeftIcon } from "@/shared/ui/icons";

import { discardWorkoutAction, finishWorkoutAction } from "../_components/actions";
import { PillActionContent, pillActionClass } from "../_components/primary-action";

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
            <main className="px-6 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pt-16">
                <div className="flex items-center justify-between md:hidden">
                    <Link
                        href="/"
                        aria-label="Voltar ao Resumo"
                        className="glass-light pressable -ml-2 flex size-11 items-center justify-center rounded-full"
                    >
                        <ChevronLeftIcon size={20} strokeWidth={1.8} />
                    </Link>
                    <span className="text-[15px] font-normal">
                        <span className="tabular-nums">{minutes}</span> min
                    </span>
                </div>

                <header className="mt-6 md:hidden">
                    <h1 className="text-[34px] font-normal leading-tight">
                        Treino {workout.label}
                    </h1>
                    <p className="mt-1.5 text-[15px] text-ink-secondary">
                        {doneExercises} de {workout.exercises.length} exercícios concluídos
                    </p>
                </header>

                <div className="mt-6 md:hidden">
                    <ExerciseList workout={workout} />
                </div>

                <div className="hidden min-h-[50vh] flex-col justify-center md:flex">
                    <p className="num text-[96px] leading-[0.8]">
                        {doneExercises}
                        <span className="text-dot-off">/{workout.exercises.length}</span>
                    </p>
                    <p className="mt-5 text-[17px] text-ink-secondary">
                        Exercícios concluídos em {minutes} min. Escolha um exercício na lista.
                    </p>
                </div>

                <form action={discardWorkoutAction} className="mt-10">
                    <button
                        type="submit"
                        className="pressable text-[15px] font-normal text-red-text"
                    >
                        Descartar treino
                    </button>
                </form>
            </main>

            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),20px)]">
                <form
                    action={finishWorkoutAction}
                    className="float-bar pointer-events-auto w-full max-w-md rounded-full p-2"
                >
                    <button type="submit" className={pillActionClass}>
                        <PillActionContent icon={<CheckIcon size={20} />}>
                            Finalizar treino
                            <span className="text-[13px] text-on-ink-secondary">
                                {doneExercises} de {workout.exercises.length}
                            </span>
                        </PillActionContent>
                    </button>
                </form>
            </div>
        </>
    );
}
