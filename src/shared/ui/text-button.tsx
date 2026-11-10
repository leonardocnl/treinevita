/*
 * TextButton: a rounded rectangle (44px high, radius 14, never a pill) with
 * the label in Mona 900/125 at 13px. `tint` for secondary actions ("Pular",
 * "Sair"), `ink` for the one that closes a mode ("Concluir").
 */
import type { ReactNode } from "react";

import { ActionElement, type ActionElementProps } from "./action-element";
import { cx } from "./cx";

type TextButtonProps = ActionElementProps & {
    children: ReactNode;
    tone?: "tint" | "ink";
};

export function TextButton({ tone = "tint", ...props }: TextButtonProps) {
    return (
        <ActionElement
            {...props}
            className={cx(
                "pressable focus-ring action inline-flex h-11 shrink-0 items-center justify-center rounded-button px-4 text-13 disabled:opacity-40",
                tone === "ink" ? "bg-ink text-bg" : "bg-tint text-ink",
            )}
        />
    );
}
