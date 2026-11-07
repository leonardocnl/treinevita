import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChevronLeftIcon, PlayIcon } from "@/shared/ui/icons";

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
        <main className="px-4 pb-48 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pb-16 md:pt-14">
            <div className="flex items-center justify-between">
                <Link
                    href="/treino"
                    aria-label="Voltar à lista de exercícios"
                    className="glass pressable flex size-11 items-center justify-center rounded-full md:invisible"
                >
                    <ChevronLeftIcon size={22} />
                </Link>
                <span className="text-[15px] text-ink-secondary">
                    {position} de {workout.exercises.length}
                </span>
                <a
                    href={videoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Ver execução do exercício"
                    className="glass pressable flex size-11 items-center justify-center rounded-full"
                >
                    <PlayIcon size={18} />
                </a>
            </div>

            <header className="mt-5 flex flex-col gap-1.5 px-2">
                <h1 className="numeric text-[32px] font-extrabold leading-[1.08]">
                    {exercise.name}
                </h1>
                <p className="text-[15px] text-ink-secondary">{prescriptionText(exercise)}</p>
            </header>

            <div className="mt-5" key={exercise.performedExerciseId}>
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
