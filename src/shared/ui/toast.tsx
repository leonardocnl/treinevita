"use client";

/*
 * A short message above the bottom bar, on the glass surface (radius 20), with
 * one action ("Tentar de novo"). It rises in, is announced to screen readers and goes away
 * by itself after a few seconds. Used when an optimistic change could not be saved.
 */
import { useEffect, useRef } from "react";

import { TextButton } from "./text-button";

type ToastProps = {
    message: string;
    actionLabel: string;
    onAction: () => void;
    onDismiss: () => void;
};

const VISIBLE_MS = 6000;

export function Toast({ message, actionLabel, onAction, onDismiss }: ToastProps) {
    const onDismissRef = useRef(onDismiss);
    useEffect(() => {
        onDismissRef.current = onDismiss;
    });
    useEffect(() => {
        const timer = setTimeout(() => onDismissRef.current(), VISIBLE_MS);
        return () => clearTimeout(timer);
    }, [message]);

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(34px,env(safe-area-inset-bottom))+80px)] z-30 flex justify-center px-margin">
            <div
                role="alert"
                className="glass rise-in pointer-events-auto flex w-full max-w-md items-center justify-between gap-gutter rounded-cta py-inner pl-margin pr-inner text-15 font-medium"
            >
                <span className="min-w-0">{message}</span>
                <TextButton onClick={onAction}>{actionLabel}</TextButton>
            </div>
        </div>
    );
}
