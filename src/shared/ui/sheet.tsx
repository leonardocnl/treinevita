"use client";

/*
 * A sheet that slides up from the bottom (translateY) while the backdrop fades
 * in. It closes by dragging the handle or the title down, tapping the backdrop,
 * pressing Esc or the close button. Opaque paper, 32px top radius, a grab
 * handle and the title as a small headline.
 * While open, Tab stays inside it, and on closing the focus returns to whatever
 * opened it.
 */
import {
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
} from "react";

import { cx } from "./cx";
import { IconButton } from "./icon-button";

type SheetProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Matches --vita-duration-exit in globals.css. */
const LEAVE_MS = 200;
/** Dragged this far (px), or flicked this fast (px/ms), the sheet closes. */
const CLOSE_DISTANCE = 96;
const CLOSE_VELOCITY = 0.5;

export function Sheet({ open, onClose, title, children }: SheetProps) {
    const titleId = useId();
    const dialogRef = useRef<HTMLDivElement>(null);
    const drag = useRef<{ y: number; time: number } | null>(null);
    const [mounted, setMounted] = useState(open);
    const [leaving, setLeaving] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [wasOpen, setWasOpen] = useState(open);

    // Kept in a ref so a new onClose on each render does not reopen (and refocus) the sheet.
    const onCloseRef = useRef(onClose);
    useEffect(() => {
        onCloseRef.current = onClose;
    });

    // Opening mounts at once; closing keeps the sheet on screen while it slides away.
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            setMounted(true);
            setLeaving(false);
            setDragY(0);
        } else if (mounted) {
            setLeaving(true);
        }
    }

    useEffect(() => {
        if (!leaving) {
            return;
        }
        const timer = setTimeout(() => {
            setMounted(false);
            setLeaving(false);
            setDragY(0);
        }, LEAVE_MS);
        return () => clearTimeout(timer);
    }, [leaving]);

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

    if (!mounted) {
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

    function startDrag(event: PointerEvent<HTMLDivElement>) {
        // The close button keeps its own click.
        if ((event.target as Element).closest("button") || leaving) {
            return;
        }
        drag.current = { y: event.clientY, time: event.timeStamp };
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
    }

    function moveDrag(event: PointerEvent<HTMLDivElement>) {
        if (drag.current) {
            setDragY(Math.max(0, event.clientY - drag.current.y));
        }
    }

    function endDrag(event: PointerEvent<HTMLDivElement>) {
        if (!drag.current) {
            return;
        }
        const distance = Math.max(0, event.clientY - drag.current.y);
        const velocity = distance / Math.max(1, event.timeStamp - drag.current.time);
        drag.current = null;
        setDragging(false);
        if (distance > CLOSE_DISTANCE || (distance > 16 && velocity > CLOSE_VELOCITY)) {
            onClose();
        } else {
            setDragY(0);
        }
    }

    return (
        <div
            className={cx(
                "fixed inset-0 z-40 flex items-end justify-center",
                leaving && "pointer-events-none",
            )}
        >
            <div
                aria-hidden
                onClick={onClose}
                className={cx("absolute inset-0 bg-scrim", leaving ? "leave opacity-0" : "fade-in")}
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onKeyDown={trapTab}
                style={{ transform: leaving ? "translateY(100%)" : `translateY(${dragY}px)` }}
                className={cx(
                    "relative flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-sheet bg-bg text-ink outline-none",
                    // Rises once on open; follows the finger while dragged; springs back (settle) on release.
                    leaving ? "leave" : cx("sheet-in", !dragging && "sheet-snap"),
                )}
            >
                <div
                    onPointerDown={startDrag}
                    onPointerMove={moveDrag}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    className="shrink-0 cursor-grab touch-none select-none px-margin pb-inner"
                >
                    <div className="flex h-6 items-center justify-center">
                        <span aria-hidden className="h-1 w-9 rounded-full bg-off" />
                    </div>
                    <div className="flex min-h-11 items-center justify-between gap-gutter">
                        <h2 id={titleId} className="action min-w-0 truncate text-20">
                            {title}
                        </h2>
                        <IconButton icon="close" onClick={onClose} aria-label="Fechar" />
                    </div>
                </div>
                <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-margin pt-inner pb-[max(env(safe-area-inset-bottom),32px)] text-17">
                    {children}
                </div>
            </div>
        </div>
    );
}
