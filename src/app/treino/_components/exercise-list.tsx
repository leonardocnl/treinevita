"use client";

import { setsLabel } from "@/shared/format/numbers";
import { DotMeter } from "@/shared/ui/dot-meter";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { List, ListRow } from "@/shared/ui/list";
import { Caption, Label } from "@/shared/ui/text";

import type { WorkoutExercise } from "./workout-state";

/**
 * The workout's exercises with their progress; full screen on the phone, sidebar
 * on desktop. Rows are real links (open in a new tab works), but a tap opens the
 * exercise on the client at once, without a server round trip.
 */
export function ExerciseList({
    exercises,
    active,
    onOpen,
}: {
    exercises: readonly WorkoutExercise[];
    active: number | null;
    onOpen: (position: number) => void;
}) {
    return (
        <List>
            {exercises.map((exercise, index) => {
                const done = exercise.doneSets.length;
                const complete = done >= exercise.targetSets;
                const isActive = active === index + 1;
                const goesUp = exercise.decision?.kind === "increase" && done === 0;
                return (
                    <ListRow
                        key={exercise.performedExerciseId}
                        style={{ "--stagger": index } as React.CSSProperties}
                        className="rise-in"
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
                            aria-current={isActive ? "step" : undefined}
                            className={`pressable -mx-3 my-1 flex min-h-16 items-center gap-4 rounded-2xl px-3 ${
                                isActive ? "bg-paper" : ""
                            }`}
                        >
                            <ExerciseThumb media={exercise.media} />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <Label
                                    as="span"
                                    size={17}
                                    tone={complete ? "secondary" : undefined}
                                    weight={complete ? undefined : "normal"}
                                    className="truncate"
                                >
                                    {exercise.name}
                                </Label>
                                <Caption as="span">
                                    {complete
                                        ? "Concluído"
                                        : goesUp
                                          ? "Sobe de carga hoje"
                                          : setsLabel(done, exercise.targetSets)}
                                </Caption>
                            </span>
                            <DotMeter
                                total={exercise.targetSets}
                                done={done}
                                highlight={goesUp ? 0 : undefined}
                                label={`${setsLabel(done, exercise.targetSets)} feitas`}
                            />
                        </a>
                    </ListRow>
                );
            })}
        </List>
    );
}
