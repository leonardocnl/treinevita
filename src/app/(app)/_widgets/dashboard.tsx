"use client";

import { useState, useTransition, type ReactNode } from "react";

import type { WidgetDefinition, WidgetKind, WidgetPlacement, WidgetSize } from "@/modules/progress";
import { IconButton } from "@/shared/ui/icon-button";
import { Icon } from "@/shared/ui/icons";
import { List, ListRow } from "@/shared/ui/list";
import { PlusLabel } from "@/shared/ui/plus-button";
import { SegmentedControl, type SegmentedOption } from "@/shared/ui/segmented-control";
import { Sheet } from "@/shared/ui/sheet";
import { Caption, Label } from "@/shared/ui/text";
import { WidgetAddTile, WidgetTile } from "@/shared/ui/widget-tile";
import { WidgetGrid } from "@/shared/ui/widget-grid";

import { saveLayoutAction } from "../../_components/actions";

type DashboardProps = {
    header: ReactNode;
    /** The workout to start, between the top bar and the widgets. */
    hero: ReactNode;
    /** The theme toggle, at the top right next to the edit button. */
    themeToggle: ReactNode;
    initialLayout: WidgetPlacement[];
    catalog: Record<WidgetKind, WidgetDefinition>;
    /** Server-rendered content of each widget in each supported size. */
    renders: Record<string, Partial<Record<WidgetSize, ReactNode>>>;
};

const TILE_INSET = 8;

const sizeOptions: Record<WidgetSize, SegmentedOption<WidgetSize>> = {
    small: { value: "small", label: "Pequeno", content: <Icon name="tile-small" /> },
    medium: { value: "medium", label: "Largo", content: <Icon name="tile-medium" /> },
    large: { value: "large", label: "Grande", content: <Icon name="tile-large" /> },
};

/** The Summary grid: widgets in three sizes, editable with the pencil button. */
export function Dashboard({
    header,
    hero,
    themeToggle,
    initialLayout,
    catalog,
    renders,
}: DashboardProps) {
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
                    <div className="flex items-center gap-3 self-start">
                        <IconButton icon="close" onClick={cancel} aria-label="Cancelar edição" />
                        <IconButton
                            icon="check"
                            onClick={finish}
                            disabled={pending}
                            aria-label={pending ? "Salvando o painel" : "Salvar o painel"}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 self-start">
                        <IconButton
                            icon="pencil"
                            onClick={() => setEditing(true)}
                            aria-label="Editar o painel"
                        />
                        {themeToggle}
                    </div>
                )}
            </div>

            {hero && !editing ? <div className="mt-intro">{hero}</div> : null}

            <div className="mt-section">
                <WidgetGrid>
                    {layout.map((item, index) => {
                        const definition = catalog[item.kind];
                        return (
                            <WidgetTile
                                key={item.kind}
                                size={item.size}
                                label={definition.title}
                                index={index}
                                overlay={
                                    editing ? (
                                        <div
                                            className="fade-in absolute inset-0 flex flex-col justify-between bg-paper/45 backdrop-blur-[2px]"
                                            // Concentric with the 26px tile: 16px chip radius + 10px gap.
                                            style={{ padding: TILE_INSET }}
                                        >
                                            <div className="flex justify-between">
                                                <IconButton
                                                    icon="minus"
                                                    onClick={() => update(index, null)}
                                                    aria-label={`Remover ${definition.title}`}
                                                />
                                                <div className="flex gap-3">
                                                    <IconButton
                                                        icon="chevron-left"
                                                        onClick={() => move(index, -1)}
                                                        disabled={index === 0}
                                                        aria-label={`Mover ${definition.title} para antes`}
                                                    />
                                                    <IconButton
                                                        icon="chevron-right"
                                                        onClick={() => move(index, 1)}
                                                        disabled={index === layout.length - 1}
                                                        aria-label={`Mover ${definition.title} para depois`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-start gap-2">
                                                <Label weight="normal">{definition.title}</Label>
                                                {definition.sizes.length > 1 ? (
                                                    <SegmentedControl
                                                        label="Tamanho"
                                                        options={definition.sizes.map(
                                                            (size) => sizeOptions[size],
                                                        )}
                                                        value={item.size}
                                                        onChange={(size) => update(index, { size })}
                                                    />
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : undefined
                                }
                            >
                                {renders[item.kind]?.[item.size]}
                            </WidgetTile>
                        );
                    })}

                    {editing && available.length > 0 ? (
                        <WidgetAddTile label="Adicionar" onClick={() => setAdding(true)} />
                    ) : null}
                </WidgetGrid>
            </div>

            <Sheet open={adding} onClose={() => setAdding(false)} title="Adicionar widget">
                <List as="ul" className="mt-4">
                    {available.map((kind) => {
                        const definition = catalog[kind];
                        const defaultSize: WidgetSize = definition.sizes.includes("medium")
                            ? "medium"
                            : definition.sizes[0];
                        return (
                            <ListRow key={kind}>
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
                                        <Label
                                            as="span"
                                            size={17}
                                            weight="normal"
                                            className="block"
                                        >
                                            {definition.title}
                                        </Label>
                                        <Caption as="span" className="block">
                                            {definition.description}
                                        </Caption>
                                    </span>
                                    <PlusLabel size={32} />
                                </button>
                            </ListRow>
                        );
                    })}
                </List>
            </Sheet>
        </>
    );
}
