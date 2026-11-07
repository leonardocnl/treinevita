"use client";

import { useState, useTransition, type ReactNode } from "react";

import type { WidgetDefinition, WidgetKind, WidgetPlacement, WidgetSize } from "@/modules/progress";

import { saveLayoutAction } from "../../_components/actions";

type DashboardProps = {
    header: ReactNode;
    initialLayout: WidgetPlacement[];
    catalog: Record<WidgetKind, WidgetDefinition>;
    /** Server-rendered content of each widget in each supported size. */
    renders: Record<string, Partial<Record<WidgetSize, ReactNode>>>;
};

const sizeClass: Record<WidgetSize, string> = {
    small: "col-span-1 row-span-1",
    medium: "col-span-2 row-span-1",
    large: "col-span-2 row-span-2",
};

const sizeLabel: Record<WidgetSize, string> = {
    small: "Pequeno",
    medium: "Largo",
    large: "Grande",
};

/** The Summary grid: widgets in three sizes, editable with the "Editar" button. */
export function Dashboard({ header, initialLayout, catalog, renders }: DashboardProps) {
    const [layout, setLayout] = useState(initialLayout);
    const [saved, setSaved] = useState(initialLayout);
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [pending, startTransition] = useTransition();

    const available = (Object.keys(catalog) as WidgetKind[]).filter(
        (kind) => !layout.some((item) => item.kind === kind),
    );

    function update(index: number, change: Partial<WidgetPlacement> | null) {
        setLayout((current) => {
            if (change === null) {
                return current.filter((_, position) => position !== index);
            }
            return current.map((item, position) =>
                position === index ? { ...item, ...change } : item,
            );
        });
    }

    function move(index: number, delta: number) {
        setLayout((current) => {
            const target = index + delta;
            if (target < 0 || target >= current.length) {
                return current;
            }
            const next = [...current];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function finish() {
        startTransition(async () => {
            const result = await saveLayoutAction(layout);
            setLayout(result);
            setSaved(result);
            setEditing(false);
            setAdding(false);
        });
    }

    function cancel() {
        setLayout(saved);
        setEditing(false);
        setAdding(false);
    }

    return (
        <>
            <div className="flex items-baseline justify-between">
                <div className="min-w-0">{header}</div>
                {editing ? (
                    <div className="flex gap-5">
                        <button
                            type="button"
                            onClick={cancel}
                            className="pressable text-[15px] text-ink-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={finish}
                            disabled={pending}
                            className="pressable text-[15px] font-medium text-red-text"
                        >
                            {pending ? "Salvando" : "Concluir"}
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="pressable text-[15px] font-normal"
                    >
                        Editar
                    </button>
                )}
            </div>

            <div className="@container mt-6">
                <div className="widget-grid grid grid-cols-2 gap-3 [grid-auto-flow:dense] md:grid-cols-4">
                    {layout.map((item, index) => {
                        const definition = catalog[item.kind];
                        return (
                            <article
                                key={item.kind}
                                aria-label={definition.title}
                                style={{ "--stagger": index } as React.CSSProperties}
                                className={`rise-in relative overflow-hidden rounded-[26px] bg-paper ${sizeClass[item.size]} ${
                                    editing ? "ring-1 ring-hairline" : ""
                                }`}
                            >
                                <div
                                    className={`h-full ${editing ? "pointer-events-none opacity-40" : ""}`}
                                >
                                    <div className="h-full">{renders[item.kind]?.[item.size]}</div>
                                </div>
                                {editing ? (
                                    <div className="absolute inset-0 flex flex-col justify-between bg-paper/45 p-3 backdrop-blur-[2px]">
                                        <div className="flex justify-between">
                                            <button
                                                type="button"
                                                onClick={() => update(index, null)}
                                                aria-label={`Remover ${definition.title}`}
                                                className="pressable flex size-8 items-center justify-center rounded-full bg-ink text-canvas"
                                            >
                                                <svg
                                                    aria-hidden
                                                    width="14"
                                                    height="14"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2.4"
                                                    strokeLinecap="round"
                                                >
                                                    <path d="M6 12h12" />
                                                </svg>
                                            </button>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => move(index, -1)}
                                                    disabled={index === 0}
                                                    aria-label={`Mover ${definition.title} para antes`}
                                                    className="pressable flex size-8 items-center justify-center rounded-full bg-canvas disabled:opacity-30"
                                                >
                                                    <Chevron direction="left" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => move(index, 1)}
                                                    disabled={index === layout.length - 1}
                                                    aria-label={`Mover ${definition.title} para depois`}
                                                    className="pressable flex size-8 items-center justify-center rounded-full bg-canvas disabled:opacity-30"
                                                >
                                                    <Chevron direction="right" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start gap-2">
                                            <p className="text-[15px] font-normal">
                                                {definition.title}
                                            </p>
                                            {definition.sizes.length > 1 ? (
                                                <div
                                                    role="radiogroup"
                                                    aria-label="Tamanho"
                                                    className="flex gap-1 rounded-full bg-canvas p-1"
                                                >
                                                    {definition.sizes.map((size) => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            role="radio"
                                                            aria-checked={item.size === size}
                                                            aria-label={sizeLabel[size]}
                                                            onClick={() => update(index, { size })}
                                                            className={`pressable flex size-8 items-center justify-center rounded-full ${
                                                                item.size === size
                                                                    ? "bg-ink text-canvas"
                                                                    : "text-ink-secondary"
                                                            }`}
                                                        >
                                                            <SizeIcon size={size} />
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </article>
                        );
                    })}

                    {editing && available.length > 0 ? (
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            className="pressable col-span-1 row-span-1 flex flex-col items-center justify-center gap-2 rounded-[26px] border border-dashed border-dot-off text-[15px] text-ink-secondary"
                        >
                            <span className="text-[28px] font-light leading-none text-ink">+</span>
                            Adicionar
                        </button>
                    ) : null}
                </div>
            </div>

            {adding ? (
                <div
                    className="fixed inset-0 z-40 flex items-end justify-center bg-ink/20"
                    onClick={() => setAdding(false)}
                >
                    <div
                        role="dialog"
                        aria-label="Adicionar widget"
                        onClick={(event) => event.stopPropagation()}
                        className="float-bar rise-in m-3 w-full max-w-md rounded-[30px] p-5 pb-6"
                    >
                        <div className="flex items-baseline justify-between">
                            <h2 className="text-[22px] font-normal">Adicionar widget</h2>
                            <button
                                type="button"
                                onClick={() => setAdding(false)}
                                className="pressable text-[15px] text-ink-secondary"
                            >
                                Fechar
                            </button>
                        </div>
                        <ul className="mt-4">
                            {available.map((kind) => {
                                const definition = catalog[kind];
                                const defaultSize: WidgetSize = definition.sizes.includes("medium")
                                    ? "medium"
                                    : definition.sizes[0];
                                return (
                                    <li
                                        key={kind}
                                        className="border-b border-hairline last:border-b-0"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLayout((current) => [
                                                    ...current,
                                                    { kind, size: defaultSize },
                                                ]);
                                                setAdding(false);
                                            }}
                                            className="pressable flex w-full items-center justify-between gap-4 py-3.5 text-left"
                                        >
                                            <span>
                                                <span className="block text-[17px] font-normal">
                                                    {definition.title}
                                                </span>
                                                <span className="block text-[13px] text-ink-secondary">
                                                    {definition.description}
                                                </span>
                                            </span>
                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red text-[20px] leading-none text-white">
                                                +
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
    return (
        <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
        </svg>
    );
}

function SizeIcon({ size }: { size: WidgetSize }) {
    const shapes: Record<WidgetSize, ReactNode> = {
        small: <rect x="8" y="8" width="8" height="8" rx="2" />,
        medium: <rect x="4" y="8" width="16" height="8" rx="2" />,
        large: <rect x="5" y="5" width="14" height="14" rx="3" />,
    };
    return (
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            {shapes[size]}
        </svg>
    );
}
