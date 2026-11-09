import type { AppContext } from "@/modules/tenancy";
import { getProfile } from "@/modules/identity";
import { getActiveProgram, nextWorkoutInRotation } from "@/modules/training";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { List, ListRow } from "@/shared/ui/list";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Caption, Label, Title } from "@/shared/ui/text";
import { Wordmark } from "@/shared/ui/wordmark";

import { startWorkoutAction } from "../_components/actions";
import { AppNav } from "../_components/app-nav";
import { ThemeToggle } from "../_components/theme-toggle";

/**
 * Home until the first workout is logged: a greeting, the next workout and the
 * action to start it. The widget dashboard takes over after the first session.
 */
export async function Welcome({
    context,
    hasOpenSession,
}: {
    context: AppContext;
    hasOpenSession: boolean;
}) {
    const [profile, program] = await Promise.all([getProfile(context), getActiveProgram(context)]);
    const workout = program ? nextWorkoutInRotation(program, null) : null;
    const name = profile?.displayName ?? context.displayName;

    return (
        <>
            <main className="mx-auto w-full max-w-md px-5 pb-32 pt-[max(env(safe-area-inset-top),52px)]">
                <div className="flex items-center justify-between">
                    <Wordmark label="VITA" />
                    <ThemeToggle />
                </div>

                <Title size={40} weight="light" leading="1.08" className="mt-10">
                    {name ? `Olá, ${name}` : "Olá"}
                </Title>
                <Label size={17} tone="secondary" className="mt-3 max-w-sm">
                    O painel aparece depois do seu primeiro treino.
                </Label>

                {workout ? (
                    <section aria-labelledby="proximo-treino" className="mt-10">
                        <Caption>Próximo treino</Caption>
                        <Title
                            as="h2"
                            size={34}
                            weight="normal"
                            leading="tight"
                            id="proximo-treino"
                            className="mt-1"
                        >
                            Treino {workout.label}
                        </Title>
                        <div className="mt-4">
                            <List>
                                {workout.exercises.map((exercise, index) => (
                                    <ListRow
                                        key={exercise.prescribedExerciseId}
                                        className="rise-in flex min-h-16 items-center gap-3"
                                        style={{ "--stagger": index } as React.CSSProperties}
                                    >
                                        <ExerciseThumb media={exercise.media} />
                                        <Label as="span" size={17} className="truncate">
                                            {exercise.name}
                                        </Label>
                                    </ListRow>
                                ))}
                            </List>
                        </div>
                        <div className="mt-8">
                            {hasOpenSession ? (
                                <PrimaryAction
                                    href="/treino"
                                    glyph="arrow"
                                    label="Continuar treino"
                                />
                            ) : (
                                <form action={startWorkoutAction}>
                                    <PrimaryAction
                                        type="submit"
                                        glyph="arrow"
                                        label="Começar treino"
                                    />
                                </form>
                            )}
                        </div>
                    </section>
                ) : (
                    <Label size={17} tone="secondary" className="mt-10">
                        Sua ficha está vazia.
                    </Label>
                )}
            </main>
            <AppNav active="resumo" />
        </>
    );
}
