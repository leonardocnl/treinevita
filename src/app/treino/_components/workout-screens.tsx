"use client";

/*
 * The workout screens (list and set logging) run on the client from the
 * workout loaded once by the page. Moving between them changes the screen in
 * the same frame, with the slide, and updates the URL with `history.pushState`
 * (refresh and back keep working) without asking the server for anything.
 * Logging, undoing and correcting sets are optimistic (see workout-state.ts).
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
import { BottomBar } from "@/shared/ui/bottom-bar";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { IconButton } from "@/shared/ui/icon-button";
import { Icon } from "@/shared/ui/icons";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { NAV_BACK, NAV_FORWARD, ScreenTransition } from "@/shared/ui/screen-transition";
import { Stepper } from "@/shared/ui/stepper";
import { Toast } from "@/shared/ui/toast";

import {
    finishWorkoutAction,
    logSetAction,
    undoSetAction,
    updateSetAction,
} from "../../_components/actions";

import { DiscardWorkout } from "./discard-workout";
import { ExerciseScreen } from "./exercise-screen";
import {
    createWorkoutStore,
    positionFromPath,
    runOperation,
    visibleExercises,
    type LoggedSet,
    type SetOperation,
    type WorkoutExercise,
    type WorkoutStore,
} from "./workout-state";

function sendOperation(operation: SetOperation): Promise<boolean> {
    switch (operation.kind) {
        case "log":
            return logSetAction({
                performedExerciseId: operation.performedExerciseId,
                ...operation.set,
            });
        case "undo":
            return undoSetAction({ performedExerciseId: operation.performedExerciseId });
        case "edit":
            return updateSetAction({
                performedExerciseId: operation.performedExerciseId,
                position: operation.index,
                ...operation.set,
            });
    }
}

/*
 * The open workout lives in this module for the whole visit, so leaving to the
 * home and coming back keeps every set logged since. Browser only: on the
 * server each request renders from its own data and nothing is shared.
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

    const go = useCallback(
        (next: number | null) => {
            startTransition(() => {
                addTransitionType(
                    next === null || (position !== null && next < position)
                        ? NAV_BACK[0]
                        : NAV_FORWARD[0],
                );
                setPosition(next);
            });
            window.history.pushState(null, "", next === null ? "/treino" : `/treino/${next}`);
        },
        [position],
    );

    const exercise = position === null ? undefined : exercises[position - 1];

    return (
        <>
            <ScreenTransition key={exercise ? exercise.performedExerciseId : "list"}>
                {exercise && position !== null ? (
                    <ExerciseScreen
                        exercise={exercise}
                        exercises={exercises}
                        position={position}
                        startedAt={workout.startedAt}
                        onGo={go}
                        onLog={(set: LoggedSet) =>
                            run({
                                id: nextOperationId++,
                                kind: "log",
                                performedExerciseId: exercise.performedExerciseId,
                                set,
                            })
                        }
                        onUndo={() =>
                            run({
                                id: nextOperationId++,
                                kind: "undo",
                                performedExerciseId: exercise.performedExerciseId,
                            })
                        }
                        onEdit={(index, set) =>
                            run({
                                id: nextOperationId++,
                                kind: "edit",
                                performedExerciseId: exercise.performedExerciseId,
                                index,
                                set,
                            })
                        }
                    />
                ) : (
                    <WorkoutOverview label={workout.label} exercises={exercises} onOpen={go} />
                )}
            </ScreenTransition>
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
    exercises,
    onOpen,
}: {
    label: string;
    exercises: readonly WorkoutExercise[];
    onOpen: (position: number) => void;
}) {
    const complete = (exercise: WorkoutExercise) => exercise.doneSets.length >= exercise.targetSets;
    const doneCount = exercises.filter(complete).length;
    const firstOpen = exercises.findIndex((exercise) => !complete(exercise));

    return (
        <>
            <main className="pt-top mx-auto w-full max-w-md px-margin pb-[calc(max(34px,env(safe-area-inset-bottom))+112px)]">
                <div className="flex h-10 items-center justify-between">
                    <IconButton icon="chevron-left" href="/" aria-label="Voltar ao Resumo" />
                    <DiscardWorkout />
                </div>

                <p className="label mt-intro">Em andamento</p>
                <h1 className="headline mt-inner text-34">Treino {label}</h1>
                <div className="mt-intro">
                    <Stepper
                        label="Exercícios do treino"
                        steps={exercises.map((exercise, index) =>
                            complete(exercise)
                                ? "done"
                                : index === firstOpen
                                  ? "current"
                                  : "future",
                        )}
                        onSelect={(index) => onOpen(index + 1)}
                        stepLabel={(index) => exercises[index].name}
                    />
                </div>

                <ol className="mt-block flex flex-col gap-inner">
                    {exercises.map((exercise, index) => (
                        <li
                            key={exercise.performedExerciseId}
                            className="rise-in"
                            style={{ "--stagger": index } as React.CSSProperties}
                        >
                            <a
                                href={`/treino/${index + 1}`}
                                onClick={(event) => {
                                    if (event.metaKey || event.ctrlKey || event.shiftKey) {
                                        return;
                                    }
                                    event.preventDefault();
                                    onOpen(index + 1);
                                }}
                                className="pressable focus-ring flex min-h-16 items-center gap-gutter"
                            >
                                <ExerciseThumb media={exercise.media} />
                                <span className="flex min-w-0 flex-1 flex-col gap-1">
                                    <span
                                        className={`truncate text-17 font-semibold ${complete(exercise) ? "text-secondary" : ""}`}
                                    >
                                        {exercise.name}
                                    </span>
                                    <span className="text-13 text-secondary tabular-nums">
                                        {complete(exercise)
                                            ? "concluído"
                                            : `${exercise.doneSets.length} de ${exercise.targetSets} séries`}
                                    </span>
                                </span>
                                <Icon name="chevron-right" size={20} />
                            </a>
                        </li>
                    ))}
                </ol>
            </main>

            <BottomBar>
                <form action={finishWorkoutAction} className="flex-1">
                    <PrimaryAction
                        type="submit"
                        glyph="check"
                        label="Finalizar"
                        meta={`${doneCount} de ${exercises.length} exercícios`}
                    />
                </form>
            </BottomBar>
        </>
    );
}
