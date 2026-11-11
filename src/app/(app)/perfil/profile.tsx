"use client";

/*
 * Perfil (mockup "Perfil v3"): a back button on the left and, on the right,
 * the theme toggle and "Sair" (asks first). Then the photo in a 160px circle
 * (or the initial over a gray gradient) with a "+" to change it, and the name
 * in Mona 900/125, one word per line, as wide as the screen. Then CORPO and
 * TREINO: open rows, the label on the left and the value in Mona Black on the
 * right; a tap edits it right there with the same wheel as the onboarding.
 * No workout stats here.
 */
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";

import type { ProfileInput } from "@/modules/identity";
import { formatNumber } from "@/shared/format/numbers";
import { IconButton } from "@/shared/ui/icon-button";
import { Icon } from "@/shared/ui/icons";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { NAV_BACK } from "@/shared/ui/screen-transition";
import { Sheet } from "@/shared/ui/sheet";
import { TextButton } from "@/shared/ui/text-button";
import { WheelPicker } from "@/shared/ui/wheel-picker";

import { signOutAction } from "../../_components/actions";
import { NAV_CLEARANCE } from "../../_components/app-nav";
import {
    recordWeightAction,
    removeAvatarAction,
    setRestAction,
    updateProfileAction,
    uploadAvatarAction,
    type ActionResult,
} from "../../_components/profile-actions";
import { HeightPicker, WeeklyGoalPicker, WeightPicker } from "../../_components/profile-fields";
import { ThemeToggle } from "../../_components/theme-toggle";

import { prepareAvatar } from "./avatar-image";

type Field = "height" | "weight" | "weekly" | "rest";

type ProfileProps = {
    profile: ProfileInput;
    /** How many workouts the active plan rotates (3 for A/B/C), or null without a plan. */
    cycle: number | null;
    /** The rest most exercises of the plan use, in seconds. */
    restSeconds: number | null;
    /** When the photo last changed (ms), or null without one. */
    avatarVersion: number | null;
};

const REST_VALUES = Array.from({ length: 19 }, (_, index) => 30 + index * 15);

/** "45" s, "1:30" min. */
function restParts(seconds: number): { value: string; unit: string } {
    if (seconds < 60) {
        return { value: String(seconds), unit: "s" };
    }
    const rest = seconds % 60;
    return {
        value:
            rest === 0
                ? String(seconds / 60)
                : `${Math.floor(seconds / 60)}:${String(rest).padStart(2, "0")}`,
        unit: "min",
    };
}

export function Profile({ profile, cycle, restSeconds, avatarVersion }: ProfileProps) {
    const [editing, setEditing] = useState<Field | null>(null);
    const [draft, setDraft] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();
    const [signingOut, setSigningOut] = useState(false);

    const values: Record<Field, number> = {
        height: profile.heightCm,
        weight: profile.weightKg,
        weekly: profile.weeklyGoal,
        rest: restSeconds ?? 90,
    };

    function toggle(field: Field) {
        setError(null);
        setDraft(values[field]);
        setEditing(editing === field ? null : field);
    }

    function save() {
        startTransition(async () => {
            const saves: Record<Field, () => Promise<ActionResult>> = {
                height: () => updateProfileAction({ ...profile, heightCm: draft }),
                weight: () => recordWeightAction(draft),
                weekly: () => updateProfileAction({ ...profile, weeklyGoal: draft }),
                rest: () => setRestAction(draft),
            };
            const result = editing ? await saves[editing]() : undefined;
            if (result) {
                setError(result.error);
                return;
            }
            setEditing(null);
        });
    }

    function editor(field: Field, picker: ReactNode) {
        if (editing !== field) {
            return null;
        }
        return (
            <div className="pb-intro">
                {picker}
                {error ? (
                    <p className="mt-label text-17 font-semibold" role="alert">
                        {error}
                    </p>
                ) : null}
                <div className="mt-label">
                    <PrimaryAction
                        onClick={save}
                        disabled={pending}
                        glyph="check"
                        label={pending ? "Salvando" : "Salvar"}
                    />
                </div>
            </div>
        );
    }

    const rest = restSeconds === null ? null : restParts(restSeconds);

    return (
        <main className={`pt-top mx-auto w-full max-w-md px-margin ${NAV_CLEARANCE}`}>
            <header className="flex h-10 items-center justify-between gap-gutter">
                <IconButton
                    icon="chevron-left"
                    href="/"
                    transitionTypes={NAV_BACK}
                    aria-label="Voltar ao Resumo"
                />
                <div className="flex items-center gap-inner">
                    <ThemeToggle />
                    <IconButton
                        icon="sign-out"
                        onClick={() => setSigningOut(true)}
                        aria-label="Sair da conta"
                    />
                </div>
            </header>

            <section className="mt-intro flex flex-col items-center gap-intro">
                <AvatarPicker name={profile.displayName} version={avatarVersion} />
                <BigName name={profile.displayName} />
            </section>

            <Section title="Corpo">
                <Row
                    label="Altura"
                    value={String(profile.heightCm)}
                    unit="cm"
                    open={editing === "height"}
                    onToggle={() => toggle("height")}
                />
                {editor("height", <HeightPicker value={draft} onChange={setDraft} />)}
                <Row
                    label="Peso"
                    value={formatNumber(profile.weightKg, 1)}
                    unit="kg"
                    open={editing === "weight"}
                    onToggle={() => toggle("weight")}
                />
                {editor("weight", <WeightPicker value={draft} onChange={setDraft} />)}
            </Section>

            <Section title="Treino">
                <Row
                    label="Meta semanal"
                    value={String(profile.weeklyGoal)}
                    unit="por semana"
                    open={editing === "weekly"}
                    onToggle={() => toggle("weekly")}
                />
                {editor("weekly", <WeeklyGoalPicker value={draft} onChange={setDraft} />)}
                {cycle !== null ? (
                    <Link
                        href="/treinos"
                        className="pressable focus-ring flex min-h-16 items-center justify-between gap-gutter"
                    >
                        <span className="text-17">Ciclo</span>
                        <Value value={String(cycle)} unit={cycle === 1 ? "treino" : "treinos"} />
                    </Link>
                ) : null}
                {rest ? (
                    <>
                        <Row
                            label="Descanso"
                            value={rest.value}
                            unit={rest.unit}
                            open={editing === "rest"}
                            onToggle={() => toggle("rest")}
                        />
                        {editor(
                            "rest",
                            <WheelPicker
                                label="Descanso entre séries"
                                values={REST_VALUES}
                                value={draft}
                                onChange={setDraft}
                                format={(seconds) => {
                                    const parts = restParts(seconds);
                                    return parts.unit === "s" ? `${parts.value} s` : parts.value;
                                }}
                                unit="descanso em todos os exercícios"
                            />,
                        )}
                    </>
                ) : null}
            </Section>

            <p className="mt-section text-center">
                <Link href="/creditos" className="pressable focus-ring label inline-block py-inner">
                    Créditos
                </Link>
            </p>

            <Sheet open={signingOut} onClose={() => setSigningOut(false)} title="Sair da conta?">
                <p className="text-17 text-secondary">
                    Para voltar, é só entrar de novo com a sua conta Google.
                </p>
                <form action={signOutAction} className="mt-intro">
                    <PrimaryAction type="submit" glyph="arrow" label="Sair" />
                </form>
            </Sheet>
        </main>
    );
}

/** An open row: the label on the left, the value in Mona Black with its unit in gray on the right. */
function Row({
    label,
    value,
    unit,
    open,
    onToggle,
}: {
    label: string;
    value: string;
    unit: string;
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={`${label}: ${value} ${unit}. Toque para editar`}
            className="pressable focus-ring flex min-h-16 w-full items-center justify-between gap-gutter text-left"
        >
            <span className="text-17">{label}</span>
            <Value value={value} unit={unit} />
        </button>
    );
}

function Value({ value, unit }: { value: string; unit: string }) {
    return (
        <span className="flex items-baseline gap-1.5">
            <span className="text-34 font-black leading-none tabular-nums">{value}</span>
            <span className="text-15 text-secondary">{unit}</span>
        </span>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-section">
            <h2 className="label text-center">{title}</h2>
            <div className="mt-label flex flex-col">{children}</div>
        </section>
    );
}

/*
 * Advance widths (em) of Mona Sans 900, width 125, optical size 100, A to Z,
 * measured from the font file. The name's size is worked out from them, so the
 * server renders it already fitted to the width, with no jump.
 */
const ADVANCES =
    "884 744 875 804 680 642 862 838 293 447 842 611 1028 851 885 715 886 783 732 716 769 868 1175 850 834 669"
        .split(" ")
        .map((value) => Number(value) / 1000);
const TRACKING = -0.02;

function wordEms(word: string): number {
    const letters = word.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase();
    let ems = 0;
    for (const letter of letters) {
        const index = letter.charCodeAt(0) - 65;
        ems += (index >= 0 && index < 26 ? ADVANCES[index] : 0.8) + TRACKING;
    }
    return Math.max(ems, 0.5);
}

/** The name, one word per line, each as wide as the column (96%), capped for very short names. */
function BigName({ name }: { name: string }) {
    const words = name.trim().split(/\s+/);
    return (
        <h1 className="@container headline w-full text-center leading-[0.8]">
            {words.map((word, index) => (
                <span
                    key={index}
                    className="block whitespace-nowrap"
                    style={{ fontSize: `min(192px, calc(96cqi / ${wordEms(word).toFixed(3)}))` }}
                >
                    {word}
                </span>
            ))}
        </h1>
    );
}

/*
 * The photo, or the initial over a gray gradient, in a 160px circle. The "+"
 * at its bottom right (with a ring of the background around it) picks a photo;
 * with a photo already there it also offers "Remover foto".
 */
function AvatarPicker({ name, version }: { name: string; version: number | null }) {
    const input = useRef<HTMLInputElement>(null);
    const [choosing, setChoosing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, startTransition] = useTransition();

    function pick() {
        setChoosing(false);
        input.current?.click();
    }

    function upload(file: File | undefined) {
        if (!file) {
            return;
        }
        setError(null);
        startTransition(async () => {
            const photo = await prepareAvatar(file);
            if (!photo) {
                setError("Não deu para usar essa foto. Tente outra.");
                return;
            }
            const form = new FormData();
            form.set("photo", photo, "avatar");
            const result = await uploadAvatarAction(form);
            if (result) {
                setError(result.error);
            }
        });
    }

    function remove() {
        setChoosing(false);
        setError(null);
        startTransition(async () => {
            const result = await removeAvatarAction();
            if (result) {
                setError(result.error);
            }
        });
    }

    return (
        <div className="flex flex-col items-center">
            <div className="relative size-40">
                <div
                    className={`size-40 overflow-hidden rounded-full ${pending ? "opacity-40" : ""}`}
                >
                    {version !== null ? (
                        <Image
                            src={`/api/avatar?v=${version}`}
                            alt={`Foto de ${name}`}
                            width={160}
                            height={160}
                            unoptimized
                            className="size-full object-cover"
                        />
                    ) : (
                        <span
                            aria-hidden
                            className="headline flex size-full items-center justify-center bg-linear-to-br from-off to-secondary text-64 text-ink"
                        >
                            {name.trim().charAt(0)}
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => (version !== null ? setChoosing(true) : pick())}
                    disabled={pending}
                    aria-label={version !== null ? "Trocar ou remover a foto" : "Escolher foto"}
                    className="pressable focus-ring tap-target absolute right-1 bottom-1 flex size-10 items-center justify-center rounded-full bg-ink text-bg ring-4 ring-bg disabled:opacity-40"
                >
                    <Icon name="plus" size={20} />
                </button>
                <input
                    ref={input}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => {
                        upload(event.target.files?.[0]);
                        event.target.value = "";
                    }}
                />
            </div>
            {error ? (
                <p className="mt-label text-15 font-semibold" role="alert">
                    {error}
                </p>
            ) : null}

            <Sheet open={choosing} onClose={() => setChoosing(false)} title="Foto">
                <div className="flex flex-col gap-inner">
                    <PrimaryAction onClick={pick} glyph="arrow" label="Escolher outra foto" />
                    <TextButton onClick={remove}>Remover foto</TextButton>
                </div>
            </Sheet>
        </div>
    );
}
