import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ExerciseDemo } from "@/shared/ui/exercise-demo";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { Label, Title } from "@/shared/ui/text";

import {
    askText,
    lastTimeText,
    loadOpenWorkout,
    prescriptionText,
} from "../_components/load-workout";
import { SetLogger } from "../_components/set-logger";

export const metadata: Metadata = { title: "Exercício · VITA" };

/**
 * Focus screen of one exercise. The URL carries only its position in the
 * workout (1 to 8), never an id: the data always comes from the person's own
 * open session.
 */
export default async function ExercisePage({ params }: { params: Promise<{ posicao: string }> }) {
    const { posicao } = await params;
    const position = Number(posicao);
    const workout = await loadOpenWorkout();

    if (!Number.isInteger(position) || position < 1 || position > workout.exercises.length) {
        notFound();
    }

    const exercise = workout.exercises[position - 1];
    const nextHref = position < workout.exercises.length ? `/treino/${position + 1}` : null;
    const increasedTo = exercise.decision?.kind === "increase" ? exercise.decision.loadKg : null;
    const videoHref =
        exercise.videoUrl ??
        `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} execução`)}`;

    return (
        <main className="px-4 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pb-16 md:pt-16">
            <div className="flex items-center justify-between">
                <GlassIconButton
                    href="/treino"
                    aria-label="Voltar à lista de exercícios"
                    className="md:invisible"
                >
                    <Icon name="chevron-left" size={20} strokeWidth={1.8} />
                </GlassIconButton>
                <Label as="span" weight="normal">
                    {position} de {workout.exercises.length}
                </Label>
                <GlassIconButton
                    href={videoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver execução do exercício"
                >
                    <Icon name="play" size={15} />
                </GlassIconButton>
            </div>

            <header className="mt-6 flex flex-col gap-2 px-2">
                <Title size={32} weight="light" leading="1.1">
                    {exercise.name}
                </Title>
                <Label tone="secondary">{prescriptionText(exercise)}</Label>
            </header>

            <div className="mt-6">
                <ExerciseDemo name={exercise.name} media={exercise.media} />
            </div>

            <div className="mt-6" key={exercise.performedExerciseId}>
                <SetLogger
                    performedExerciseId={exercise.performedExerciseId}
                    measurement={exercise.measurement}
                    targetSets={exercise.targetSets}
                    doneSets={exercise.doneSets.map((set) => ({
                        loadKg: set.loadKg,
                        reps: set.reps,
                        durationSeconds: set.durationSeconds,
                    }))}
                    incrementKg={exercise.incrementKg}
                    suggested={exercise.suggested}
                    increasedTo={increasedTo}
                    askText={askText(exercise)}
                    lastTimeText={lastTimeText(exercise)}
                    nextHref={nextHref}
                />
            </div>
        </main>
    );
}
