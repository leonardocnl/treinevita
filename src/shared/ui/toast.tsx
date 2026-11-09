"use client";

/*
 * A short message above the floating bar, in smoke glass, with one action
 * ("Tentar de novo"). It rises in, is announced to screen readers and goes away
 * by itself after a few seconds. Used when an optimistic change could not be saved.
 */
import { useEffect, useRef } from "react";

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
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),20px)+76px)] z-30 flex justify-center px-3 md:bottom-8">
            <div
                role="alert"
                className="smoke rise-in pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-2 text-[15px]"
            >
                <span className="min-w-0">{message}</span>
                <button
                    type="button"
                    onClick={onAction}
                    className="pressable tap-target shrink-0 rounded-full px-3 py-2 font-normal"
                >
                    {actionLabel}
                </button>
            </div>
        </div>
    );
}
