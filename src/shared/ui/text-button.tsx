/*
 * A button that is only text at 15px, with a 44×44px hit area. Text actions
 * live only in Ajustes and Perfil, plus "Pular" and "Limpar ficha" (DESIGN.md, "Labels").
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";

const toneClass = {
    primary: "font-normal",
    secondary: "text-ink-secondary",
    accent: "font-normal text-red-text",
    "accent-strong": "font-medium text-red-text",
} as const;

type TextButtonProps = ActionElementProps & {
    children: ReactNode;
    /**
     * primary: ink at 400 ("Editar"); secondary: grey at 300 ("Cancelar", "Fechar");
     * accent: red at 400 ("Descartar treino"); accent-strong: red at 500 ("Concluir").
     */
    tone?: keyof typeof toneClass;
};

export function TextButton({ tone = "primary", ...props }: TextButtonProps) {
    return (
        <ActionElement
            {...props}
            className={`pressable tap-target text-[15px] ${toneClass[tone]}`}
        />
    );
}
