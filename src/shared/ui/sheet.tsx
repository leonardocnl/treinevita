"use client";

/*
 * A sheet that rises from the bottom over a dimmed screen. It closes with a tap
 * outside, with Esc or with "Fechar"; while open, Tab stays inside it, and on
 * closing the focus returns to whatever opened it.
 */
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";

import { TextButton } from "./text-button";
import { Title } from "./text";

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({ open, onClose, title, children }: SheetProps) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    // Kept in a ref so a new onClose on each render does not reopen (and refocus) the sheet.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) {
            return;
        }
        const opener =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialogRef.current?.focus();
        function onKey(event: globalThis.KeyboardEvent) {
            if (event.key === "Escape") {
                onCloseRef.current();
            }
        }
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("keydown", onKey);
            opener?.focus();
        };
    }, [open]);

    if (!open) {
        return null;
    }

    function trapTab(event: KeyboardEvent<HTMLDivElement>) {
        if (event.key !== "Tab" || !dialogRef.current) {
            return;
        }
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (items.length === 0) {
            event.preventDefault();
            return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === dialogRef.current)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    }

    return (
        <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-ink/20"
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={trapTab}
                className="float-bar rise-in m-3 w-full max-w-md rounded-panel p-5 pb-6 outline-none"
            >
                <div className="flex items-baseline justify-between">
                    <Title as="h2" size={22} weight="normal" id={titleId}>
                        {title}
                    </Title>
                    <TextButton tone="secondary" onClick={onClose}>
                        Fechar
                    </TextButton>
                </div>
                {children}
            </div>
        </div>
    );
}
