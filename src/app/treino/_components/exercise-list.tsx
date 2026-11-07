"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import type { WorkoutView } from "@/modules/progress";
import { CheckIcon, ArrowUpIcon } from "@/shared/ui/icons";

/** The workout's exercises with their progress; used full screen on the phone and as a sidebar on desktop. */
export function ExerciseList({ workout }: { workout: WorkoutView }) {
    const segment = useSelectedLayoutSegment();
    const activePosition = segment ? Number(segment) : undefined;
    return (
        <ol className="flex flex-col gap-2">
            {workout.exercises.map((exercise, index) => {
                const done = exercise.doneSets.length;
                const complete = done >= exercise.targetSets;
                const isActive = activePosition === index + 1;
                const goesUp = exercise.decision?.kind === "increase" && done === 0;
                return (
                    <li
                        key={exercise.performedExerciseId}
                        style={{ "--stagger": index } as React.CSSProperties}
                        className="rise-in"
                    >
                        <Link
                            href={`/treino/${index + 1}`}
                            aria-current={isActive ? "step" : undefined}
                            className={`pressable flex min-h-16 items-center gap-4 rounded-widget px-5 py-3 ${
                                isActive ? "bg-ink text-paper" : "glass"
                            }`}
                        >
                            <span className="flex flex-1 flex-col gap-0.5">
                                <span className="text-[17px] font-semibold leading-snug">
                                    {exercise.name}
                                </span>
                                <span
                                    className={`text-[13px] ${isActive ? "text-on-ink-secondary" : "text-ink-secondary"}`}
                                >
                                    {complete
                                        ? "Concluído"
                                        : `${done} de ${exercise.targetSets} séries`}
                                </span>
                            </span>
                            {complete ? (
                                <CheckIcon
                                    size={20}
                                    aria-hidden={false}
                                    role="img"
                                    aria-label="Concluído"
                                />
                            ) : goesUp ? (
                                <ArrowUpIcon
                                    size={16}
                                    className="text-red"
                                    aria-hidden={false}
                                    role="img"
                                    aria-label="Sobe de carga hoje"
                                />
                            ) : null}
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}
