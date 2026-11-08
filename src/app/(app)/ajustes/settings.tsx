"use client";

/*
 * Ajustes: Perfil (every profile field, each edited in a sheet), Aparência
 * (theme, stored in a cookie) and Conta (email, credits, sign out).
 */
import { useState, useTransition, type ReactNode } from "react";

import type { ProfileInput } from "@/modules/identity";
import { formatNumber } from "@/shared/format/numbers";
import type { Theme } from "@/shared/theme/theme";
import { ChoiceList, type Choice } from "@/shared/ui/choice-list";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { PillAction } from "@/shared/ui/pill-action";
import { Sheet } from "@/shared/ui/sheet";
import { Caption, Label, Title } from "@/shared/ui/text";
import { TextButton } from "@/shared/ui/text-button";
import { TextField } from "@/shared/ui/text-field";

import { signOutAction } from "../../_components/actions";
import { setThemeAction, updateProfileAction } from "../../_components/profile-actions";
import {
    BodyPicker,
    EXPERIENCE_OPTIONS,
    GOAL_OPTIONS,
    PLACE_OPTIONS,
    SESSION_OPTIONS,
    WeeklyGoalPicker,
    choiceLabel,
} from "../../_components/profile-fields";

const THEME_OPTIONS: Choice<Theme>[] = [
    { value: "system", label: "Sistema", detail: "Segue o claro ou escuro do celular." },
    { value: "light", label: "Claro" },
    { value: "dark", label: "Escuro" },
];

type Field = "name" | "goal" | "experience" | "weekly" | "body" | "session" | "place";

const FIELD_TITLES: Record<Field, string> = {
    name: "Nome",
    goal: "Objetivo",
    experience: "Experiência",
    weekly: "Meta semanal",
    body: "Peso e altura",
    session: "Tempo por treino",
    place: "Onde treina",
};

type SettingsProps = { profile: ProfileInput; theme: Theme; email: string };

export function Settings({ profile, theme: initialTheme, email }: SettingsProps) {
    const [editing, setEditing] = useState<Field | null>(null);
    const [draft, setDraft] = useState(profile);
    const [error, setError] = useState<string | null>(null);
    const [theme, setTheme] = useState(initialTheme);
    const [pending, startTransition] = useTransition();

    function open(field: Field) {
        setDraft(profile);
        setError(null);
        setEditing(field);
    }

    function save() {
        startTransition(async () => {
            const result = await updateProfileAction(draft);
            if (result) {
                setError(result.error);
                return;
            }
            setEditing(null);
        });
    }

    function chooseTheme(value: Theme) {
        setTheme(value);
        startTransition(() => setThemeAction(value));
    }

    const rows: { field: Field; value: string }[] = [
        { field: "name", value: profile.displayName },
        { field: "goal", value: choiceLabel(GOAL_OPTIONS, profile.goal) },
        { field: "experience", value: choiceLabel(EXPERIENCE_OPTIONS, profile.experience) },
        { field: "weekly", value: `${profile.weeklyGoal} por semana` },
        {
            field: "body",
            value: `${formatNumber(profile.weightKg)} kg, ${profile.heightCm} cm`,
        },
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
        body: (
            <BodyPicker
                weightKg={draft.weightKg}
                heightCm={draft.heightCm}
                onChange={(body) => setDraft({ ...draft, ...body })}
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
    };

    return (
        <main className="mx-auto w-full max-w-md px-6 pb-24 pt-[max(env(safe-area-inset-top),52px)]">
            <GlassIconButton href="/" aria-label="Voltar ao Resumo" className="-ml-2">
                <Icon name="chevron-left" size={20} strokeWidth={1.8} />
            </GlassIconButton>
            <Title size={34} weight="normal" leading="tight" className="mt-6">
                Ajustes
            </Title>

            <Group title="Perfil">
                {rows.map((row) => (
                    <button
                        key={row.field}
                        type="button"
                        onClick={() => open(row.field)}
                        className="pressable flex min-h-16 w-full items-center gap-3 border-b border-hairline text-left last:border-b-0"
                    >
                        <Label as="span" size={17} className="flex-1">
                            {FIELD_TITLES[row.field]}
                        </Label>
                        <Label as="span" tone="secondary" className="truncate tabular-nums">
                            {row.value}
                        </Label>
                        <span className="text-ink-secondary">
                            <Icon name="chevron-right" size={16} />
                        </span>
                    </button>
                ))}
            </Group>

            <Group title="Aparência">
                <ChoiceList
                    label="Tema"
                    options={THEME_OPTIONS}
                    value={theme}
                    onChange={chooseTheme}
                />
            </Group>

            <Group title="Conta">
                <div className="flex min-h-16 items-center justify-between gap-3 border-b border-hairline">
                    <Label as="span" size={17}>
                        Email
                    </Label>
                    <Label as="span" tone="secondary" className="truncate">
                        {email}
                    </Label>
                </div>
                <a
                    href="/creditos"
                    className="pressable flex min-h-16 items-center justify-between border-b border-hairline"
                >
                    <Label as="span" size={17}>
                        Créditos
                    </Label>
                    <span className="text-ink-secondary">
                        <Icon name="chevron-right" size={16} />
                    </span>
                </a>
                <form action={signOutAction} className="flex min-h-16 items-center">
                    <TextButton type="submit" tone="accent">
                        Sair
                    </TextButton>
                </form>
            </Group>

            <Sheet
                open={editing !== null}
                onClose={() => setEditing(null)}
                title={editing ? FIELD_TITLES[editing] : ""}
            >
                <div className="mt-5">{editing ? editors[editing] : null}</div>
                {error ? (
                    <Label role="alert" tone="accent" className="mt-4">
                        {error}
                    </Label>
                ) : null}
                <div className="mt-6">
                    <PillAction
                        onClick={save}
                        disabled={pending || draft.displayName.trim().length === 0}
                        icon={<Icon name="check" size={20} />}
                    >
                        {pending ? "Salvando" : "Salvar"}
                    </PillAction>
                </div>
            </Sheet>
        </main>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-10">
            <Caption as="p">{title}</Caption>
            <div className="mt-2">{children}</div>
        </section>
    );
}
