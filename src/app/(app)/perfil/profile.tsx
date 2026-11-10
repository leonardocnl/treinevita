"use client";

/*
 * Perfil: the person (name, goal, experience, weekly goal, time per workout,
 * place), Corpo (weight with its trend, height, "Registrar peso") and the way
 * to Ajustes. Each field opens a sheet with the same picker as the onboarding.
 */
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";

import type { ProfileInput } from "@/modules/identity";
import { formatNumber } from "@/shared/format/numbers";
import { ChoiceList } from "@/shared/ui/choice-list";
import { Icon } from "@/shared/ui/icons";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Sheet } from "@/shared/ui/sheet";
import { SectionLabel } from "@/shared/ui/section-label";
import { WeightChart } from "@/shared/ui/weight-chart";
import { TextField } from "@/shared/ui/text-field";

import { NAV_CLEARANCE } from "../../_components/app-nav";
import { recordWeightAction, updateProfileAction } from "../../_components/profile-actions";
import { ThemeToggle } from "../../_components/theme-toggle";
import { TopBar } from "../../_components/top-bar";
import {
    EXPERIENCE_OPTIONS,
    GOAL_OPTIONS,
    HeightPicker,
    PLACE_OPTIONS,
    SESSION_OPTIONS,
    WeeklyGoalPicker,
    WeightPicker,
    choiceLabel,
} from "../../_components/profile-fields";

type Field = "name" | "goal" | "experience" | "weekly" | "session" | "place" | "height" | "weight";

const FIELD_TITLES: Record<Field, string> = {
    name: "Nome",
    goal: "Objetivo",
    experience: "Experiência",
    weekly: "Meta semanal",
    session: "Tempo por treino",
    place: "Onde treina",
    height: "Altura",
    weight: "Registrar peso",
};

type ProfileProps = {
    profile: ProfileInput;
    /** Latest weigh-ins, oldest first. */
    weightTrend: readonly number[];
};

export function Profile({ profile, weightTrend }: ProfileProps) {
    const [editing, setEditing] = useState<Field | null>(null);
    const [draft, setDraft] = useState(profile);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function open(field: Field) {
        setDraft(profile);
        setError(null);
        setEditing(field);
    }

    function save() {
        startTransition(async () => {
            const result =
                editing === "weight"
                    ? await recordWeightAction(draft.weightKg)
                    : await updateProfileAction(draft);
            if (result) {
                setError(result.error);
                return;
            }
            setEditing(null);
        });
    }

    const person: { field: Field; value: string }[] = [
        { field: "name", value: profile.displayName },
        { field: "goal", value: choiceLabel(GOAL_OPTIONS, profile.goal) },
        { field: "experience", value: choiceLabel(EXPERIENCE_OPTIONS, profile.experience) },
        { field: "weekly", value: `${profile.weeklyGoal} por semana` },
        { field: "session", value: choiceLabel(SESSION_OPTIONS, profile.sessionMinutes) },
        { field: "place", value: choiceLabel(PLACE_OPTIONS, profile.trainingPlace) },
    ];

    const editors: Record<Field, ReactNode> = {
        name: (
            <TextField
                label="Nome"
                value={draft.displayName}
                onChange={(displayName) => setDraft({ ...draft, displayName })}
                maxLength={40}
                autoComplete="given-name"
            />
        ),
        goal: (
            <ChoiceList
                label="Objetivo"
                options={GOAL_OPTIONS}
                value={draft.goal}
                onChange={(goal) => setDraft({ ...draft, goal })}
            />
        ),
        experience: (
            <ChoiceList
                label="Experiência"
                options={EXPERIENCE_OPTIONS}
                value={draft.experience}
                onChange={(experience) => setDraft({ ...draft, experience })}
            />
        ),
        weekly: (
            <WeeklyGoalPicker
                value={draft.weeklyGoal}
                onChange={(weeklyGoal) => setDraft({ ...draft, weeklyGoal })}
            />
        ),
        session: (
            <ChoiceList
                label="Tempo por treino"
                options={[...SESSION_OPTIONS, { value: 0, label: "Não informar" }]}
                value={draft.sessionMinutes ?? 0}
                onChange={(minutes) =>
                    setDraft({
                        ...draft,
                        sessionMinutes:
                            minutes === 0 ? null : (minutes as typeof draft.sessionMinutes),
                    })
                }
            />
        ),
        place: (
            <ChoiceList
                label="Onde treina"
                options={[...PLACE_OPTIONS, { value: "none", label: "Não informar" }]}
                value={draft.trainingPlace ?? "none"}
                onChange={(place) =>
                    setDraft({
                        ...draft,
                        trainingPlace:
                            place === "none" ? null : (place as typeof draft.trainingPlace),
                    })
                }
            />
        ),
        height: (
            <HeightPicker
                value={draft.heightCm}
                onChange={(heightCm) => setDraft({ ...draft, heightCm })}
            />
        ),
        weight: (
            <WeightPicker
                value={draft.weightKg}
                onChange={(weightKg) => setDraft({ ...draft, weightKg })}
            />
        ),
    };

    return (
        <main className={`pt-top mx-auto w-full max-w-md px-margin ${NAV_CLEARANCE}`}>
            <TopBar>
                <ThemeToggle />
            </TopBar>
            <h1 className="headline mt-intro text-34">Perfil</h1>

            <Group title="Você">
                {person.map((row) => (
                    <EditRow
                        key={row.field}
                        label={FIELD_TITLES[row.field]}
                        value={row.value}
                        onEdit={() => open(row.field)}
                    />
                ))}
            </Group>

            <Group title="Corpo">
                <div className="flex min-h-16 items-center gap-gutter py-inner">
                    <span className="flex flex-1 flex-col gap-1">
                        <span className="text-17">Peso</span>
                        <span className="text-15 text-secondary tabular-nums">
                            {formatNumber(profile.weightKg, 1)} kg
                        </span>
                    </span>
                    <span className="w-24 shrink-0">
                        <WeightChart
                            points={weightTrend.map((value, index) => ({
                                day: String(index),
                                value,
                            }))}
                            width={96}
                            height={32}
                            compact
                            label="Peso nas últimas pesagens"
                            format={(kg) => formatNumber(kg, 1)}
                        />
                    </span>
                </div>
                <EditRow
                    label="Altura"
                    value={`${profile.heightCm} cm`}
                    onEdit={() => open("height")}
                />
                <button
                    type="button"
                    onClick={() => open("weight")}
                    className="pressable focus-ring flex min-h-16 w-full items-center justify-between gap-gutter rounded-cta bg-tint px-margin text-left"
                >
                    <span className="text-17 font-semibold">Registrar peso</span>
                    <span className="text-secondary">
                        <Icon name="plus" size={20} />
                    </span>
                </button>
            </Group>

            <Group>
                <Link
                    href="/ajustes"
                    className="pressable focus-ring flex min-h-16 items-center justify-between gap-gutter rounded-cta bg-tint px-margin"
                >
                    <span className="text-17">Ajustes</span>
                    <span className="text-secondary">
                        <Icon name="chevron-right" size={20} />
                    </span>
                </Link>
            </Group>

            <Sheet
                open={editing !== null}
                onClose={() => setEditing(null)}
                title={editing ? FIELD_TITLES[editing] : ""}
            >
                <div className="mt-label">{editing ? editors[editing] : null}</div>
                {error ? (
                    <p className="text-17 font-semibold mt-label" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="mt-intro">
                    <PrimaryAction
                        onClick={save}
                        disabled={pending || draft.displayName.trim().length === 0}
                        glyph="check"
                        label={pending ? "Salvando" : "Salvar"}
                    />
                </div>
            </Sheet>
        </main>
    );
}

/** A field with its value and a pencil: the whole row opens the editor. */
function EditRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
    return (
        <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${label}: ${value}`}
            className="pressable focus-ring flex min-h-16 w-full items-center gap-gutter rounded-cta bg-tint px-margin text-left"
        >
            <span className="text-17 flex-1">{label}</span>
            <span className="text-15 text-secondary truncate tabular-nums">{value}</span>
            <span className="text-secondary">
                <Icon name="pencil" size={18} />
            </span>
        </button>
    );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
    return (
        <section className="mt-section">
            {title ? <SectionLabel>{title}</SectionLabel> : null}
            <div className="mt-label flex flex-col gap-inner">{children}</div>
        </section>
    );
}
