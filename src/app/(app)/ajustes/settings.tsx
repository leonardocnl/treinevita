"use client";

/*
 * Ajustes: Conta (email, credits, sign out) and Aparência (the theme, the same
 * vita_theme cookie as the toggle at the top). The profile lives in Perfil.
 */
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";

import type { Theme } from "@/shared/theme/theme";
import { ChoiceList, type Choice } from "@/shared/ui/choice-list";
import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { NAV_BACK } from "@/shared/ui/screen-transition";
import { Caption, Label, Title } from "@/shared/ui/text";
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
        <main className="mx-auto w-full max-w-md px-6 pb-24 pt-[max(env(safe-area-inset-top),52px)]">
            <GlassIconButton
                href="/perfil"
                transitionTypes={NAV_BACK}
                aria-label="Voltar ao Perfil"
                className="-ml-2"
            >
                <Icon name="chevron-left" size={20} />
            </GlassIconButton>
            <Title size={34} weight="normal" leading="tight" className="mt-6">
                Ajustes
            </Title>

            <Group title="Conta">
                <div className="flex min-h-16 items-center justify-between gap-3 border-b border-hairline">
                    <Label as="span" size={17}>
                        Email
                    </Label>
                    <Label as="span" tone="secondary" className="truncate">
                        {email}
                    </Label>
                </div>
                <Link
                    href="/creditos"
                    className="pressable flex min-h-16 items-center justify-between border-b border-hairline"
                >
                    <Label as="span" size={17}>
                        Créditos
                    </Label>
                    <span className="text-ink-secondary">
                        <Icon name="chevron-right" size={20} />
                    </span>
                </Link>
                <form action={signOutAction} className="flex min-h-16 items-center">
                    <TextButton type="submit" tone="accent">
                        Sair
                    </TextButton>
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
        <section className="mt-10">
            <Caption as="h2">{title}</Caption>
            <div className="mt-2">{children}</div>
        </section>
    );
}
