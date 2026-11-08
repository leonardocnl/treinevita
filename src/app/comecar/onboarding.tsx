"use client";

/*
 * The onboarding flow: one short question per screen, with back and next on
 * every one. Answers stay here until the last step, then go to the server in a
 * single action (one transaction).
 */
import { useState, useTransition, type ReactNode } from "react";

import type { CatalogEntry } from "@/modules/catalog";
import type { Experience, Goal, SessionMinutes, TrainingPlace } from "@/modules/identity";
import {
    buildDraft,
    suggestTemplate,
    type ProgramChoice,
    type ProgramDraft,
    type ProgramTemplate,
    type TemplateId,
} from "@/modules/training/client";
import { ChoiceList } from "@/shared/ui/choice-list";
import { DotMeter } from "@/shared/ui/dot-meter";
import { FloatBar } from "@/shared/ui/float-bar";
import { Icon } from "@/shared/ui/icons";
import { List, ListRow } from "@/shared/ui/list";
import { PillAction } from "@/shared/ui/pill-action";
import { RoundButton } from "@/shared/ui/round-button";
import { Label, Title } from "@/shared/ui/text";
import { TextButton } from "@/shared/ui/text-button";
import { TextField } from "@/shared/ui/text-field";
import { Wordmark } from "@/shared/ui/wordmark";

import { completeOnboardingAction } from "../_components/profile-actions";
import {
    BodyPicker,
    EXPERIENCE_OPTIONS,
    GOAL_OPTIONS,
    PLACE_OPTIONS,
    SESSION_OPTIONS,
    WeeklyGoalPicker,
} from "../_components/profile-fields";

import { ProgramReview } from "./program-review";

const STEPS = 10;
const LAST = STEPS - 1;

type OnboardingProps = {
    initialName: string;
    initialWeeklyGoal: number;
    /** The workspace's active program (the owner's A/B/C), or null. */
    currentProgram: { label: string; exercises: string[] }[] | null;
    templates: ProgramTemplate[];
    catalog: CatalogEntry[];
};

type Choice = "keep" | TemplateId;

export function Onboarding({
    initialName,
    initialWeeklyGoal,
    currentProgram,
    templates,
    catalog,
}: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [name, setName] = useState(initialName);
    const [goal, setGoal] = useState<Goal | null>(null);
    const [experience, setExperience] = useState<Experience | null>(null);
    const [weeklyGoal, setWeeklyGoal] = useState(initialWeeklyGoal);
    const [body, setBody] = useState({ weightKg: 70, heightCm: 170 });
    const [sessionMinutes, setSessionMinutes] = useState<SessionMinutes | null>(null);
    const [trainingPlace, setTrainingPlace] = useState<TrainingPlace | null>(null);
    const [picked, setPicked] = useState<Choice | null>(null);
    const [draft, setDraft] = useState<ProgramDraft | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    const suggested = suggestTemplate({
        goal: goal ?? "",
        experience: experience ?? "",
        trainingPlace,
    });
    const choice: Choice = picked ?? (currentProgram ? "keep" : suggested);
    const template = templates.find((candidate) => candidate.id === choice);
    const reviewDraft =
        choice === "keep" ? null : draft?.templateId === choice ? draft : buildDraft(choice);

    function back() {
        setError(null);
        setStep((current) => Math.max(0, current - 1));
    }

    function next() {
        setError(null);
        if (step === LAST - 1 && reviewDraft !== draft) {
            setDraft(reviewDraft);
        }
        setStep((current) => Math.min(LAST, current + 1));
    }

    function submit() {
        if (!goal || !experience) {
            return;
        }
        const program: ProgramChoice =
            choice === "keep" || !reviewDraft
                ? { kind: "keep" }
                : {
                      kind: "template",
                      templateId: reviewDraft.templateId,
                      days: reviewDraft.days.map((day) => day.slugs),
                  };
        startTransition(async () => {
            const result = await completeOnboardingAction({
                profile: {
                    displayName: name,
                    goal,
                    experience,
                    weeklyGoal,
                    weightKg: body.weightKg,
                    heightCm: body.heightCm,
                    sessionMinutes,
                    trainingPlace,
                },
                program,
            });
            if (result) {
                setError(result.error);
            }
        });
    }

    const reviewReady =
        choice === "keep" || (reviewDraft?.days.every((day) => day.slugs.length > 0) ?? false);

    const screens: {
        title: string;
        hint?: string;
        optional?: () => void;
        ready: boolean;
        body?: ReactNode;
    }[] = [
        {
            title: "Boas-vindas",
            hint: "O VITA registra cada série em segundos e mostra o quanto você evolui.",
            ready: true,
        },
        {
            title: "Como podemos te chamar?",
            ready: name.trim().length > 0 && name.trim().length <= 40,
            body: (
                <TextField
                    label="Nome"
                    value={name}
                    onChange={setName}
                    maxLength={40}
                    autoComplete="given-name"
                    enterKeyHint="next"
                />
            ),
        },
        {
            title: "Qual é o seu objetivo?",
            ready: goal !== null,
            body: (
                <ChoiceList
                    label="Objetivo"
                    options={GOAL_OPTIONS}
                    value={goal}
                    onChange={setGoal}
                />
            ),
        },
        {
            title: "Há quanto tempo você treina?",
            ready: experience !== null,
            body: (
                <ChoiceList
                    label="Experiência"
                    options={EXPERIENCE_OPTIONS}
                    value={experience}
                    onChange={setExperience}
                />
            ),
        },
        {
            title: "Quantos treinos por semana?",
            hint: "Sua meta semanal. Dá para mudar depois em Ajustes.",
            ready: true,
            body: <WeeklyGoalPicker value={weeklyGoal} onChange={setWeeklyGoal} />,
        },
        {
            title: "Seu peso e sua altura",
            hint: "Ficam só com você. O peso também vira sua primeira pesagem.",
            ready: true,
            body: <BodyPicker {...body} onChange={setBody} />,
        },
        {
            title: "Quanto tempo por treino?",
            optional: () => setSessionMinutes(null),
            ready: true,
            body: (
                <ChoiceList
                    label="Tempo por treino"
                    options={SESSION_OPTIONS}
                    value={sessionMinutes}
                    onChange={setSessionMinutes}
                />
            ),
        },
        {
            title: "Onde você treina?",
            optional: () => setTrainingPlace(null),
            ready: true,
            body: (
                <ChoiceList
                    label="Onde você treina"
                    options={PLACE_OPTIONS}
                    value={trainingPlace}
                    onChange={setTrainingPlace}
                />
            ),
        },
        {
            title: "Escolha sua ficha",
            hint: "Dá para trocar exercícios no próximo passo.",
            ready: true,
            body: (
                <ChoiceList<Choice>
                    label="Modelo de ficha"
                    value={choice}
                    onChange={setPicked}
                    options={[
                        ...(currentProgram
                            ? [
                                  {
                                      value: "keep" as const,
                                      label: "Manter minha ficha atual",
                                      detail: `Treinos ${currentProgram.map((day) => day.label).join(", ")}.`,
                                  },
                              ]
                            : []),
                        ...templates.map((candidate) => ({
                            value: candidate.id,
                            label: candidate.name,
                            detail:
                                candidate.id === suggested
                                    ? `Sugerido para você. ${candidate.description}`
                                    : candidate.description,
                        })),
                    ]}
                />
            ),
        },
        {
            title: choice === "keep" ? "Sua ficha atual" : "Revise sua ficha",
            hint: reviewReady ? undefined : "Adicione ao menos um exercício em cada dia.",
            ready: reviewReady,
            body:
                choice === "keep" || !draft || !template ? (
                    <CurrentProgram days={currentProgram ?? []} />
                ) : (
                    <ProgramReview
                        draft={draft}
                        onChange={setDraft}
                        template={template}
                        catalog={catalog}
                    />
                ),
        },
    ];

    const screen = screens[step];

    return (
        <>
            <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-40 pt-[max(env(safe-area-inset-top),52px)]">
                <div className="flex h-11 items-center justify-between">
                    {step === 0 ? (
                        <Wordmark label="VITA" />
                    ) : (
                        <DotMeter
                            total={STEPS}
                            done={step}
                            highlight={step}
                            label={`Passo ${step + 1} de ${STEPS}`}
                        />
                    )}
                    {screen.optional ? (
                        <TextButton
                            tone="secondary"
                            onClick={() => {
                                screen.optional?.();
                                next();
                            }}
                        >
                            Pular
                        </TextButton>
                    ) : null}
                </div>

                <div
                    key={step}
                    className={`rise-in flex flex-col ${step === 0 ? "mt-auto" : "mt-10"}`}
                >
                    <Title size={step === 0 ? 40 : 34} weight="light" leading="1.1">
                        {screen.title}
                    </Title>
                    {screen.hint ? (
                        <Label size={17} tone="secondary" className="mt-3 max-w-sm">
                            {screen.hint}
                        </Label>
                    ) : null}
                    {screen.body ? <div className="mt-8">{screen.body}</div> : null}
                </div>

                {error ? (
                    <Label role="alert" tone="accent" className="mt-8">
                        {error}
                    </Label>
                ) : null}
            </main>

            <FloatBar>
                {step > 0 ? (
                    <RoundButton aria-label="Voltar" onClick={back}>
                        <Icon name="chevron-left" size={20} />
                    </RoundButton>
                ) : null}
                <PillAction
                    grow
                    disabled={!screen.ready || pending}
                    onClick={step === LAST ? submit : next}
                    icon={<Icon name={step === LAST ? "check" : "arrow-right"} size={20} />}
                >
                    {step === 0
                        ? "Começar"
                        : step === LAST
                          ? pending
                              ? "Salvando"
                              : "Concluir"
                          : "Continuar"}
                </PillAction>
            </FloatBar>
        </>
    );
}

function CurrentProgram({ days }: { days: { label: string; exercises: string[] }[] }) {
    return (
        <div className="flex flex-col gap-10">
            {days.map((day) => (
                <section key={day.label}>
                    <Title as="h2" size={22} weight="normal">
                        Treino {day.label}
                    </Title>
                    <List>
                        {day.exercises.map((exercise, index) => (
                            <ListRow key={index} className="flex min-h-12 items-center">
                                <Label as="span" size={17}>
                                    {exercise}
                                </Label>
                            </ListRow>
                        ))}
                    </List>
                </section>
            ))}
        </div>
    );
}
