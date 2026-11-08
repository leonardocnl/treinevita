import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { safeExternalUrl } from "@/shared/url/external-url";
import { ExerciseDemo, youtubeSearchUrl } from "@/shared/ui/exercise-demo";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { NAV_BACK, ScreenTransition } from "@/shared/ui/screen-transition";
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
    // The catalog's reference page when it has one (https only), otherwise a YouTube search.
    const reference = safeExternalUrl(exercise.referenceUrl);

    return (
        <ScreenTransition>
            <main className="px-4 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pb-16 md:pt-16">
                <div className="grid grid-cols-[44px_1fr_44px] items-center">
                    <GlassIconButton
                        href="/treino"
                        transitionTypes={NAV_BACK}
                        aria-label="Voltar à lista de exercícios"
                        className="md:invisible"
                    >
                        <Icon name="chevron-left" size={20} />
                    </GlassIconButton>
                    <Label as="span" weight="normal" className="text-center tabular-nums">
                        {position} de {workout.exercises.length}
                    </Label>
                </div>

                <header className="mt-6 flex items-start gap-4 px-2">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Title size={32} weight="light" leading="1.1">
                            {exercise.name}
                        </Title>
                        <Label tone="secondary">{prescriptionText(exercise)}</Label>
                    </div>
                    {/* Apart from back and next, so it cannot be read as "próximo". */}
                    <GlassIconButton
                        href={reference ?? youtubeSearchUrl(exercise.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={
                            reference
                                ? `Ver ${exercise.name} em outro site, abre em nova aba`
                                : `Buscar ${exercise.name} no YouTube, abre em nova aba`
                        }
                        className="mt-1 shrink-0"
                    >
                        <Icon name="external-link" size={20} />
                    </GlassIconButton>
                </header>

                {exercise.media ? (
                    <div className="mt-6">
                        <ExerciseDemo name={exercise.name} media={exercise.media} />
                    </div>
                ) : null}

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
        </ScreenTransition>
    );
}
