"use client";

/*
 * Ajustes: Conta (email, credits, sign out) and Aparência (the theme, the same
 * vita_theme cookie as the toggle at the top). The profile lives in Perfil.
 */
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";

import type { Theme } from "@/shared/theme/theme";
import { ChoiceList, type Choice } from "@/shared/ui/choice-list";
import { IconButton } from "@/shared/ui/icon-button";
import { SectionLabel } from "@/shared/ui/section-label";
import { Icon } from "@/shared/ui/icons";
import { NAV_BACK } from "@/shared/ui/screen-transition";
import { TextButton } from "@/shared/ui/text-button";

import { signOutAction } from "../../_components/actions";
import { setThemeAction } from "../../_components/profile-actions";

const THEME_OPTIONS: Choice<Theme>[] = [
    { value: "system", label: "Sistema", detail: "Segue o claro ou escuro do celular." },
    { value: "light", label: "Claro" },
    { value: "dark", label: "Escuro" },
];

type SettingsProps = { theme: Theme; email: string };

export function Settings({ theme: initialTheme, email }: SettingsProps) {
    const [theme, setTheme] = useState(initialTheme);
    const [, startTransition] = useTransition();

    function chooseTheme(value: Theme) {
        setTheme(value);
        startTransition(() => setThemeAction(value));
    }

    return (
        <main className="mx-auto w-full max-w-md px-margin pb-24 pt-top">
            <IconButton
                icon="chevron-left"
                href="/perfil"
                transitionTypes={NAV_BACK}
                aria-label="Voltar ao Perfil"
            />
            <h1 className="headline text-34 mt-intro">Ajustes</h1>

            <Group title="Conta">
                <div className="flex min-h-16 items-center justify-between gap-gutter">
                    <span className="text-17">Email</span>
                    <span className="text-15 truncate">{email}</span>
                </div>
                <Link
                    href="/creditos"
                    className="pressable focus-ring flex min-h-16 items-center justify-between gap-gutter rounded-cta bg-tint px-margin"
                >
                    <span className="text-17">Créditos</span>
                    <span className="text-secondary">
                        <Icon name="chevron-right" size={20} />
                    </span>
                </Link>
                <form action={signOutAction} className="flex min-h-16 items-center">
                    <TextButton type="submit">Sair</TextButton>
                </form>
            </Group>

            <Group title="Aparência">
                <ChoiceList
                    label="Tema"
                    options={THEME_OPTIONS}
                    value={theme}
                    onChange={chooseTheme}
                />
            </Group>
        </main>
    );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-section">
            <SectionLabel>{title}</SectionLabel>
            <div className="mt-label flex flex-col gap-inner">{children}</div>
        </section>
    );
}
