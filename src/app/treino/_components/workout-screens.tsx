"use client";

/*
 * The workout screens (list and exercise focus) run on the client from the
 * workout loaded once by the layout. Moving between them changes the screen in
 * the same frame, with the slide, and updates the URL with `history.pushState`
 * (refresh and back keep working) without asking the server for anything.
 * Logging and undoing sets are optimistic (see workout-state.ts).
 */
import {
    addTransitionType,
    startTransition,
    useCallback,
    useMemo,
    useState,
    useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";

import type { WorkoutView } from "@/modules/progress";
import { DotNumber } from "@/shared/ui/dot-number";
import { ExerciseDemo, youtubeSearchUrl } from "@/shared/ui/exercise-demo";
import { FloatBar } from "@/shared/ui/float-bar";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { PillAction } from "@/shared/ui/pill-action";
import { NAV_BACK, NAV_FORWARD, ScreenTransition } from "@/shared/ui/screen-transition";
import { Label, Title } from "@/shared/ui/text";
import { Toast } from "@/shared/ui/toast";
import { safeExternalUrl } from "@/shared/url/external-url";

import { finishWorkoutAction, logSetAction, undoSetAction } from "../../_components/actions";

import { DiscardWorkout } from "./discard-workout";
import { ExerciseList } from "./exercise-list";
import { SetLogger } from "./set-logger";
import {
    createWorkoutStore,
    nextSuggestion,
    positionFromPath,
    runOperation,
    visibleExercises,
    type LoggedSet,
    type SetOperation,
    type WorkoutExercise,
    type WorkoutStore,
} from "./workout-state";
import { askText, lastTimeText, prescriptionText } from "./workout-text";

function sendOperation(operation: SetOperation): Promise<boolean> {
    return operation.kind === "log"
        ? logSetAction({ performedExerciseId: operation.performedExerciseId, ...operation.set })
        : undoSetAction({ performedExerciseId: operation.performedExerciseId });
}

/*
 * The open workout lives in this module for the whole visit, so leaving to the
 * Summary and coming back (even with the browser's back button, which reuses
 * the first render) keeps every set logged since. Browser only: on the server
 * each request renders from its own data and nothing is shared between people.
 */
let browserStore: WorkoutStore | null = null;
/** Unique for the whole visit, so an operation still on its way never shares an id. */
let nextOperationId = 0;

function storeFor(workout: WorkoutView): WorkoutStore {
    if (typeof window === "undefined") {
        return createWorkoutStore(workout.sessionId, workout.exercises);
    }
    if (browserStore?.sessionId !== workout.sessionId) {
        browserStore = createWorkoutStore(workout.sessionId, workout.exercises);
    }
    return browserStore;
}

export function WorkoutScreens({ workout }: { workout: WorkoutView }) {
    const pathname = usePathname();
    const [position, setPosition] = useState(() => positionFromPath(pathname));
    // The browser's back and forward buttons change the path: follow it, without a slide.
    const [seenPath, setSeenPath] = useState(pathname);
    if (pathname !== seenPath) {
        setSeenPath(pathname);
        setPosition(positionFromPath(pathname));
    }

    const [store] = useState(() => storeFor(workout));
    const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);
    const exercises = useMemo(() => visibleExercises(state), [state]);
    const [failed, setFailed] = useState<SetOperation | null>(null);

    const run = useCallback(
        async (operation: SetOperation) => {
            setFailed(null);
            const saved = await runOperation(operation, store.dispatch, sendOperation);
            if (!saved) {
                setFailed(operation);
            }
        },
        [store],
    );

    const go = useCallback((next: number | null) => {
        startTransition(() => {
            addTransitionType(next === null ? NAV_BACK[0] : NAV_FORWARD[0]);
            setPosition(next);
        });
        window.history.pushState(null, "", next === null ? "/treino" : `/treino/${next}`);
    }, []);

    const log = (performedExerciseId: string, set: LoggedSet) =>
        run({ id: nextOperationId++, kind: "log", performedExerciseId, set });
    const undo = (performedExerciseId: string) =>
        run({ id: nextOperationId++, kind: "undo", performedExerciseId });

    const exercise = position === null ? undefined : exercises[position - 1];

    return (
        <>
            <aside aria-label="Exercícios do treino" className="hidden md:block md:pt-16">
                <div className="sticky top-10">
                    <Title as="h2" size={28} weight="normal">
                        Treino {workout.label}
                    </Title>
                    <div className="mt-6">
                        <ExerciseList exercises={exercises} active={position} onOpen={go} />
                    </div>
                </div>
            </aside>
            <div className="min-w-0">
                <ScreenTransition key={exercise ? exercise.performedExerciseId : "list"}>
                    {exercise && position !== null ? (
                        <ExerciseFocus
                            exercise={exercise}
                            position={position}
                            total={exercises.length}
                            onGo={go}
                            onLog={(set) => log(exercise.performedExerciseId, set)}
                            onUndo={() => undo(exercise.performedExerciseId)}
                        />
                    ) : (
                        <WorkoutOverview
                            label={workout.label}
                            startedAt={workout.startedAt}
                            exercises={exercises}
                            onOpen={go}
                        />
                    )}
                </ScreenTransition>
            </div>
            {failed ? (
                <Toast
                    message="Não foi possível salvar. Tente de novo."
                    actionLabel="Tentar de novo"
                    onAction={() => run({ ...failed, id: nextOperationId++ })}
                    onDismiss={() => setFailed(null)}
                />
            ) : null}
        </>
    );
}

function WorkoutOverview({
    label,
    startedAt,
    exercises,
    onOpen,
}: {
    label: string;
    startedAt: Date;
    exercises: readonly WorkoutExercise[];
    onOpen: (position: number) => void;
}) {
    const doneExercises = exercises.filter(
        (exercise) => exercise.doneSets.length >= exercise.targetSets,
    ).length;
    const [minutes] = useState(() =>
        Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000)),
    );

    return (
        <>
            <main className="px-6 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pt-16">
                <div className="flex items-center justify-between md:hidden">
                    <GlassIconButton href="/" aria-label="Voltar ao Resumo" className="-ml-2">
                        <Icon name="chevron-left" size={20} />
                    </GlassIconButton>
                    <div className="flex items-center gap-4">
                        <Label as="span" weight="normal">
                            <span className="tabular-nums" suppressHydrationWarning>
                                {minutes}
                            </span>{" "}
                            min
                        </Label>
                        <DiscardWorkout />
                    </div>
                </div>

                <header className="mt-6 md:hidden">
                    <Title size={34} weight="normal" leading="tight">
                        Treino {label}
                    </Title>
                    <Label tone="secondary" className="mt-1.5">
                        {doneExercises} de {exercises.length} exercícios concluídos
                    </Label>
                </header>

                <div className="mt-6 md:hidden">
                    <ExerciseList exercises={exercises} active={null} onOpen={onOpen} />
                </div>

                <div className="hidden min-h-[50vh] flex-col justify-center md:flex">
                    <DotNumber as="p" size={96} leading="0.8" of={exercises.length}>
                        {doneExercises}
                    </DotNumber>
                    <Label size={17} tone="secondary" className="mt-5">
                        Exercícios concluídos em <span suppressHydrationWarning>{minutes}</span>{" "}
                        min. Escolha um exercício na lista.
                    </Label>
                    <div className="mt-8">
                        <DiscardWorkout />
                    </div>
                </div>
            </main>

            <FloatBar>
                <form action={finishWorkoutAction} className="flex-1">
                    <PillAction
                        type="submit"
                        icon={<Icon name="check" size={20} />}
                        detail={`${doneExercises} de ${exercises.length}`}
                    >
                        Finalizar treino
                    </PillAction>
                </form>
            </FloatBar>
        </>
    );
}

function ExerciseFocus({
    exercise,
    position,
    total,
    onGo,
    onLog,
    onUndo,
}: {
    exercise: WorkoutExercise;
    position: number;
    total: number;
    onGo: (position: number | null) => void;
    onLog: (set: LoggedSet) => void;
    onUndo: () => void;
}) {
    const next = position < total ? position + 1 : null;
    const increasedTo = exercise.decision?.kind === "increase" ? exercise.decision.loadKg : null;
    // The catalog's reference page when it has one (https only), otherwise a YouTube search.
    const reference = safeExternalUrl(exercise.referenceUrl);

    return (
        <main className="px-4 pb-36 pt-[max(env(safe-area-inset-top),52px)] md:px-0 md:pb-16 md:pt-16">
            <div className="grid grid-cols-[44px_1fr_44px] items-center">
                <GlassIconButton
                    onClick={() => onGo(null)}
                    aria-label="Voltar à lista de exercícios"
                    className="md:invisible"
                >
                    <Icon name="chevron-left" size={20} />
                </GlassIconButton>
                <Label as="span" weight="normal" className="text-center tabular-nums">
                    {position} de {total}
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

            <div className="mt-6">
                <SetLogger
                    measurement={exercise.measurement}
                    targetSets={exercise.targetSets}
                    doneSets={exercise.doneSets}
                    incrementKg={exercise.incrementKg}
                    suggested={nextSuggestion(exercise)}
                    increasedTo={increasedTo}
                    askText={askText(exercise)}
                    lastTimeText={lastTimeText(exercise)}
                    hasNext={next !== null}
                    onLog={onLog}
                    onUndo={onUndo}
                    onNext={() => onGo(next)}
                />
            </div>
        </main>
    );
}
