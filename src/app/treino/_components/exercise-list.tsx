"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import type { WorkoutView } from "@/modules/progress";
import { DotMeter } from "@/shared/ui/dot-meter";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { List, ListRow } from "@/shared/ui/list";
import { Caption, Label } from "@/shared/ui/text";

/** The workout's exercises with their progress; full screen on the phone, sidebar on desktop. */
export function ExerciseList({ workout }: { workout: WorkoutView }) {
    const segment = useSelectedLayoutSegment();
    const activePosition = segment ? Number(segment) : undefined;

    return (
        <List>
            {workout.exercises.map((exercise, index) => {
                const done = exercise.doneSets.length;
                const complete = done >= exercise.targetSets;
                const isActive = activePosition === index + 1;
                const goesUp = exercise.decision?.kind === "increase" && done === 0;
                return (
                    <ListRow
                        key={exercise.performedExerciseId}
                        style={{ "--stagger": index } as React.CSSProperties}
                        className="rise-in"
                    >
                        <Link
                            href={`/treino/${index + 1}`}
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
                                          : `${exercise.targetSets} séries`}
                                </Caption>
                            </span>
                            <DotMeter
                                total={exercise.targetSets}
                                done={done}
                                highlight={goesUp ? 0 : undefined}
                                label={`${done} de ${exercise.targetSets} séries feitas`}
                            />
                        </Link>
                    </ListRow>
                );
            })}
        </List>
    );
}
