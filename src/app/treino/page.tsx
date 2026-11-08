import type { Metadata } from "next";
import { DotNumber } from "@/shared/ui/dot-number";
import { FloatBar } from "@/shared/ui/float-bar";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { PillAction } from "@/shared/ui/pill-action";
import { Label, Title } from "@/shared/ui/text";
import { TextButton } from "@/shared/ui/text-button";

import { discardWorkoutAction, finishWorkoutAction } from "../_components/actions";

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
                    <GlassIconButton href="/" aria-label="Voltar ao Resumo" className="-ml-2">
                        <Icon name="chevron-left" size={20} strokeWidth={1.8} />
                    </GlassIconButton>
                    <Label as="span" weight="normal">
                        <span className="tabular-nums">{minutes}</span> min
                    </Label>
                </div>

                <header className="mt-6 md:hidden">
                    <Title size={34} weight="normal" leading="tight">
                        Treino {workout.label}
                    </Title>
                    <Label tone="secondary" className="mt-1.5">
                        {doneExercises} de {workout.exercises.length} exercícios concluídos
                    </Label>
                </header>

                <div className="mt-6 md:hidden">
                    <ExerciseList workout={workout} />
                </div>

                <div className="hidden min-h-[50vh] flex-col justify-center md:flex">
                    <DotNumber as="p" size={96} leading="0.8" of={workout.exercises.length}>
                        {doneExercises}
                    </DotNumber>
                    <Label size={17} tone="secondary" className="mt-5">
                        Exercícios concluídos em {minutes} min. Escolha um exercício na lista.
                    </Label>
                </div>

                <form action={discardWorkoutAction} className="mt-10">
                    <TextButton type="submit" tone="accent">
                        Descartar treino
                    </TextButton>
                </form>
            </main>

            <FloatBar>
                <form action={finishWorkoutAction} className="flex-1">
                    <PillAction
                        type="submit"
                        icon={<Icon name="check" size={20} />}
                        detail={`${doneExercises} de ${workout.exercises.length}`}
                    >
                        Finalizar treino
                    </PillAction>
                </form>
            </FloatBar>
        </>
    );
}
