"use client";

/*
 * The onboarding flow: one short question per screen, each with one line on
 * why it is asked. Back is an icon at the top left, "Pular" (optional steps
 * only) a text button at the top right, and "Continuar" the bottom pill,
 * disabled until the step is valid. Screens slide left going forward and right
 * going back. Answers stay here until the last step, then go to the server in
 * a single action (one transaction).
 */
import { useState, useTransition, type ReactNode } from "react";

import type { CatalogEntry } from "@/modules/catalog";
import type { Experience, Goal, SessionMinutes, TrainingPlace } from "@/modules/identity";
import {
    buildDraft,
    suggest,
    type ProgramChoice,
    type ProgramDraft,
    type ProgramTemplate,
    type TemplateId,
} from "@/modules/training/client";
import { ChoiceList } from "@/shared/ui/choice-list";
import { Dot } from "@/shared/ui/dot";
import { BottomBar } from "@/shared/ui/bottom-bar";
import { IconButton } from "@/shared/ui/icon-button";
import { Stepper } from "@/shared/ui/stepper";
import { PrimaryAction } from "@/shared/ui/primary-action";
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
/** The questions after Boas-vindas, counted in "3 de 9". */
const QUESTIONS = STEPS - 1;

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
    const [direction, setDirection] = useState<"forward" | "back">("forward");
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

    const suggestion = suggest({
        goal: goal ?? "",
        experience: experience ?? "",
        trainingPlace,
    });
    const suggested = suggestion.templateId;
    const choice: Choice = picked ?? (currentProgram ? "keep" : suggested);
    const template = templates.find((candidate) => candidate.id === choice);
    const reviewDraft =
        choice === "keep" ? null : draft?.templateId === choice ? draft : buildDraft(choice);

    function back() {
        setError(null);
        setDirection("back");
        setStep((current) => Math.max(0, current - 1));
    }

    function next() {
        setError(null);
        setDirection("forward");
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
            hint: "Para te chamar pelo nome no app.",
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
            hint: "Define qual modelo de ficha vamos sugerir.",
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
            hint: "Ajusta as cargas iniciais e o ritmo de progressão.",
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
            hint: "Quantos dias por semana você quer treinar. Dá para mudar depois.",
            ready: true,
            body: <WeeklyGoalPicker value={weeklyGoal} onChange={setWeeklyGoal} />,
        },
        {
            title: "Seu peso e sua altura",
            hint: "Usados só nos seus gráficos de corpo. Ficam só com você.",
            ready: true,
            body: <BodyPicker {...body} onChange={setBody} />,
        },
        {
            title: "Quanto tempo por treino?",
            hint: "Ajuda a sugerir fichas do tamanho certo.",
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
            hint: "Mostra modelos que fazem sentido para o seu espaço.",
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
            title: "Escolha um modelo",
            hint: "Dá para trocar os exercícios no próximo passo.",
            ready: true,
            body: (
                <ChoiceList<Choice>
                    label="Modelo de ficha"
                    variant="cards"
                    value={choice}
                    onChange={setPicked}
                    options={[
                        ...(currentProgram
                            ? [
                                  {
                                      value: "keep" as const,
                                      label: "Manter minha ficha atual",
                                      detail: `Treinos ${currentProgram.map((day) => day.label).join(", ")}`,
                                      extra: (
                                          <DayLines
                                              days={currentProgram.map((day) => ({
                                                  label: day.label,
                                                  text: `${day.exercises.length} exercícios`,
                                              }))}
                                          />
                                      ),
                                  },
                              ]
                            : []),
                        ...templates.map((candidate) => ({
                            value: candidate.id,
                            label: candidate.name,
                            detail: `${candidate.daysPerWeek} dias por semana`,
                            extra: (
                                <>
                                    {candidate.id === suggested ? (
                                        <span className="flex items-start gap-inner">
                                            <Dot size={6} tone="ink" className="mt-[7px]" />
                                            <span className="flex flex-col">
                                                <span className="text-15 font-semibold">
                                                    Sugerido para você
                                                </span>
                                                <span className="text-13 text-secondary">
                                                    {suggestion.reason}
                                                </span>
                                            </span>
                                        </span>
                                    ) : null}
                                    <span className="text-15">{candidate.audience}</span>
                                    <DayLines
                                        days={candidate.days.map((day) => ({
                                            label: day.label,
                                            text: dayFocus(
                                                day.exercises.map((exercise) => exercise.slug),
                                                catalog,
                                            ),
                                        }))}
                                    />
                                </>
                            ),
                        })),
                    ]}
                />
            ),
        },
        {
            title: choice === "keep" ? "Sua ficha atual" : "Revise sua ficha",
            hint:
                choice === "keep"
                    ? "Seus treinos continuam como estão."
                    : reviewReady
                      ? "Revise os exercícios. Toque para trocar, deslize para remover."
                      : "Adicione ao menos um exercício em cada dia.",
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
            <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-margin pt-top pb-[calc(max(34px,env(safe-area-inset-bottom))+112px)]">
                <div className="flex h-11 items-center gap-gutter">
                    {step === 0 ? (
                        <Wordmark />
                    ) : (
                        <>
                            <IconButton icon="chevron-left" onClick={back} aria-label="Voltar" />
                            <Stepper
                                label={`Passo ${step} de ${QUESTIONS}`}
                                steps={Array.from({ length: QUESTIONS }, (_, index) =>
                                    index < step - 1
                                        ? "done"
                                        : index === step - 1
                                          ? "current"
                                          : "future",
                                )}
                            />
                            {screen.optional ? (
                                <TextButton
                                    onClick={() => {
                                        screen.optional?.();
                                        next();
                                    }}
                                >
                                    Pular
                                </TextButton>
                            ) : null}
                        </>
                    )}
                </div>

                <div
                    key={step}
                    className={`flex flex-col ${direction === "forward" ? "slide-forward" : "slide-back"} ${
                        step === 0 ? "mt-auto" : "mt-block"
                    }`}
                >
                    <h1 className={`headline ${step === 0 ? "text-58" : "text-34"}`}>
                        {screen.title}
                    </h1>
                    {screen.hint ? (
                        <p className="mt-label max-w-sm text-17 text-secondary">{screen.hint}</p>
                    ) : null}
                    {screen.body ? <div className="mt-block">{screen.body}</div> : null}
                </div>

                {error ? (
                    <p className="mt-block text-17 font-semibold" role="alert">
                        {error}
                    </p>
                ) : null}
            </main>

            <BottomBar>
                <PrimaryAction
                    grow
                    disabled={!screen.ready || pending}
                    onClick={step === LAST ? submit : next}
                    glyph={step === LAST ? "check" : "arrow"}
                    label={
                        step === 0 ? "Começar" : step === LAST && pending ? "Salvando" : "Continuar"
                    }
                    meta={step === 0 ? undefined : `${step} de ${QUESTIONS}`}
                />
            </BottomBar>
        </>
    );
}

/** "A: peito, costas, ombro": what each day of a model trains. */
function DayLines({ days }: { days: { label: string; text: string }[] }) {
    return (
        <span className="flex flex-col gap-1">
            {days.map((day) => (
                <span className="text-13 text-secondary" key={day.label}>
                    <span className="font-semibold text-ink">{day.label}:</span> {day.text}
                </span>
            ))}
        </span>
    );
}

/**
 * The main muscles of a day, from its exercises, in order and without repeats:
 * "Ombro (frente)" and "Ombro (lateral)" both read as "ombro". Up to four.
 */
function dayFocus(slugs: readonly string[], catalog: readonly CatalogEntry[]): string {
    const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
    const muscles = new Set<string>();
    for (const slug of slugs) {
        for (const muscle of bySlug.get(slug)?.primaryMuscles ?? []) {
            muscles.add(muscle.name.replace(/\s*\(.*\)$/, "").toLocaleLowerCase("pt-BR"));
        }
    }
    return [...muscles].slice(0, 4).join(", ");
}

function CurrentProgram({ days }: { days: { label: string; exercises: string[] }[] }) {
    return (
        <div className="flex flex-col gap-block">
            {days.map((day) => (
                <section key={day.label}>
                    <h2 className="action text-20">Treino {day.label}</h2>
                    <ol className="mt-label flex flex-col gap-inner">
                        {day.exercises.map((exercise, index) => (
                            <li key={index} className="text-17">
                                {exercise}
                            </li>
                        ))}
                    </ol>
                </section>
            ))}
        </div>
    );
}
