"use client";

/*
 * Review of the chosen template: the days and their exercises, with remove,
 * swap (same primary muscle), add and "Limpar ficha" behind a confirmation
 * sheet. It only edits the draft; saving happens with the whole onboarding.
 */
import { useState } from "react";

import type { CatalogEntry } from "@/modules/catalog";
import {
    addExercise,
    clearDraft,
    MAX_EXERCISES_PER_DAY,
    removeExercise,
    replaceExercise,
    type ProgramDraft,
    type ProgramTemplate,
} from "@/modules/training/client";
import { ExerciseThumb } from "@/shared/ui/exercise-demo";
import { Icon } from "@/shared/ui/icons";
import { List, ListRow } from "@/shared/ui/list";
import { PillAction } from "@/shared/ui/pill-action";
import { RoundButton } from "@/shared/ui/round-button";
import { Sheet } from "@/shared/ui/sheet";
import { Caption, Label, Title } from "@/shared/ui/text";
import { TextButton } from "@/shared/ui/text-button";

type Picker = { kind: "swap"; day: number; position: number } | { kind: "add"; day: number };

type ProgramReviewProps = {
    draft: ProgramDraft;
    onChange: (draft: ProgramDraft) => void;
    template: ProgramTemplate;
    catalog: readonly CatalogEntry[];
};

export function ProgramReview({ draft, onChange, template, catalog }: ProgramReviewProps) {
    const [picker, setPicker] = useState<Picker | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);
    const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));

    function prescription(dayIndex: number, slug: string): string {
        const planned = template.days[dayIndex]?.exercises.find((item) => item.slug === slug);
        const sets = planned?.sets ?? 3;
        if (planned?.durationMin !== undefined) {
            return `${sets} × ${planned.durationMin}–${planned.durationMax} s`;
        }
        if (planned) {
            return `${sets} × ${planned.repMin}–${planned.repMax}`;
        }
        return bySlug.get(slug)?.measurement === "duration" ? "3 × 30–45 s" : "3 × 10–12";
    }

    function pickerOptions(current: Picker): CatalogEntry[] {
        const taken = new Set(draft.days[current.day].slugs);
        if (current.kind === "add") {
            return catalog.filter((entry) => !taken.has(entry.slug));
        }
        const replaced = bySlug.get(draft.days[current.day].slugs[current.position]);
        const muscles = new Set(replaced?.primaryMuscles.map((muscle) => muscle.slug));
        return catalog.filter(
            (entry) =>
                !taken.has(entry.slug) &&
                entry.primaryMuscles.some((muscle) => muscles.has(muscle.slug)),
        );
    }

    function pick(slug: string) {
        if (!picker) {
            return;
        }
        onChange(
            picker.kind === "swap"
                ? replaceExercise(draft, picker.day, picker.position, slug)
                : addExercise(draft, picker.day, slug),
        );
        setPicker(null);
    }

    const options = picker ? pickerOptions(picker) : [];

    return (
        <div className="flex flex-col gap-10">
            {draft.days.map((day, dayIndex) => (
                <section key={day.label} aria-labelledby={`dia-${day.label}`}>
                    <div className="flex items-baseline justify-between">
                        <Title as="h2" size={22} weight="normal" id={`dia-${day.label}`}>
                            Treino {day.label}
                        </Title>
                        {day.title ? <Caption as="span">{day.title}</Caption> : null}
                    </div>
                    {day.slugs.length === 0 ? (
                        <Label tone="secondary" className="mt-3">
                            Nenhum exercício neste dia.
                        </Label>
                    ) : (
                        <List>
                            {day.slugs.map((slug, position) => {
                                const entry = bySlug.get(slug);
                                const name = entry?.name ?? slug;
                                return (
                                    <ListRow
                                        key={slug}
                                        className="flex min-h-16 items-center gap-3"
                                    >
                                        <ExerciseThumb media={entry?.media ?? null} />
                                        <span className="flex min-w-0 flex-1 flex-col gap-0.5 py-2">
                                            <Label as="span" size={17} weight="normal">
                                                {name}
                                            </Label>
                                            <Caption as="span" className="tabular-nums">
                                                {prescription(dayIndex, slug)}
                                            </Caption>
                                        </span>
                                        <TextButton
                                            tone="secondary"
                                            onClick={() =>
                                                setPicker({ kind: "swap", day: dayIndex, position })
                                            }
                                            aria-label={`Trocar ${name}`}
                                        >
                                            Trocar
                                        </TextButton>
                                        <RoundButton
                                            size={32}
                                            tone="canvas"
                                            onClick={() =>
                                                onChange(removeExercise(draft, dayIndex, position))
                                            }
                                            aria-label={`Remover ${name}`}
                                        >
                                            <Icon name="minus" size={16} />
                                        </RoundButton>
                                    </ListRow>
                                );
                            })}
                        </List>
                    )}
                    {day.slugs.length < MAX_EXERCISES_PER_DAY ? (
                        <div className="mt-3">
                            <TextButton onClick={() => setPicker({ kind: "add", day: dayIndex })}>
                                Adicionar exercício
                            </TextButton>
                        </div>
                    ) : null}
                </section>
            ))}

            <div>
                <TextButton tone="accent" onClick={() => setConfirmClear(true)}>
                    Limpar ficha
                </TextButton>
            </div>

            <Sheet
                open={picker !== null}
                onClose={() => setPicker(null)}
                title={picker?.kind === "swap" ? "Trocar exercício" : "Adicionar exercício"}
            >
                {options.length === 0 ? (
                    <Label tone="secondary" className="mt-4">
                        Nenhum outro exercício para esse músculo no catálogo.
                    </Label>
                ) : (
                    <ul className="no-scrollbar mt-3 max-h-[60dvh] overflow-y-auto">
                        {options.map((entry) => (
                            <ListRow key={entry.slug}>
                                <button
                                    type="button"
                                    onClick={() => pick(entry.slug)}
                                    className="pressable flex min-h-16 w-full items-center gap-3 text-left"
                                >
                                    <ExerciseThumb media={entry.media} />
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <Label as="span" size={17} weight="normal">
                                            {entry.name}
                                        </Label>
                                        <Caption as="span">
                                            {entry.primaryMuscles
                                                .map((muscle) => muscle.name)
                                                .join(", ")}
                                        </Caption>
                                    </span>
                                </button>
                            </ListRow>
                        ))}
                    </ul>
                )}
            </Sheet>

            <Sheet open={confirmClear} onClose={() => setConfirmClear(false)} title="Limpar ficha">
                <Label tone="secondary" className="mt-3">
                    Todos os dias ficam vazios. Depois você adiciona os exercícios que quiser.
                </Label>
                <div className="mt-6">
                    <PillAction
                        icon={<Icon name="check" size={20} />}
                        onClick={() => {
                            onChange(clearDraft(draft));
                            setConfirmClear(false);
                        }}
                    >
                        Limpar ficha
                    </PillAction>
                </div>
            </Sheet>
        </div>
    );
}
