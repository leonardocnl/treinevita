"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import type { WorkoutView } from "@/modules/progress";

/** The workout's exercises with their progress; full screen on the phone, sidebar on desktop. */
export function ExerciseList({ workout }: { workout: WorkoutView }) {
    const segment = useSelectedLayoutSegment();
    const activePosition = segment ? Number(segment) : undefined;

    return (
        <ol>
            {workout.exercises.map((exercise, index) => {
                const done = exercise.doneSets.length;
                const complete = done >= exercise.targetSets;
                const isActive = activePosition === index + 1;
                const goesUp = exercise.decision?.kind === "increase" && done === 0;
                return (
                    <li
                        key={exercise.performedExerciseId}
                        style={{ "--stagger": index } as React.CSSProperties}
                        className="rise-in border-b border-hairline last:border-b-0"
                    >
                        <Link
                            href={`/treino/${index + 1}`}
                            aria-current={isActive ? "step" : undefined}
                            className={`pressable -mx-3 my-1 flex min-h-16 items-center gap-4 rounded-2xl px-3 ${
                                isActive ? "bg-paper" : ""
                            }`}
                        >
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span
                                    className={`truncate text-[17px] ${complete ? "text-ink-secondary" : "font-normal"}`}
                                >
                                    {exercise.name}
                                </span>
                                <span className="text-[13px] text-ink-secondary">
                                    {complete
                                        ? "Concluído"
                                        : goesUp
                                          ? "Sobe de carga hoje"
                                          : `${exercise.targetSets} séries`}
                                </span>
                            </span>
                            <span
                                className="flex gap-1"
                                role="img"
                                aria-label={`${done} de ${exercise.targetSets} séries feitas`}
                            >
                                {Array.from({ length: exercise.targetSets }, (_, setIndex) => (
                                    <span
                                        key={setIndex}
                                        className={`size-1.5 rounded-full ${
                                            setIndex < done
                                                ? "bg-ink"
                                                : goesUp && setIndex === 0
                                                  ? "bg-red"
                                                  : "bg-dot-off"
                                        }`}
                                    />
                                ))}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}
