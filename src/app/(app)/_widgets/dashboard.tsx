"use client";

/*
 * The home below the hero: the widgets in the person's order, and the edit mode.
 *
 * Layout: two half columns (each 2 of the 4 grid columns) with the 12px gutter;
 * P takes one half, M and G the full width, widgets 64px apart (48px in edit
 * mode). Order is kept as chosen: a P without a P after it takes the left half.
 *
 * Edit mode: a control row above each widget (6-dot drag handle, SizeSelector,
 * "−" remove) and dotted corner marks around it. Dragging lifts the widget
 * (scale 1.02) and reorders live while the others slide out of the way; size
 * changes and removals reflow with transforms (FLIP). Pointer events work with
 * touch; the handle is a button and arrow up and down move the widget. Saving is
 * optimistic: "Concluir" leaves edit mode at once and saves in the background.
 */
import {
    useLayoutEffect,
    useRef,
    useState,
    useTransition,
    type PointerEvent,
    type ReactNode,
} from "react";

import {
    MAX_WIDGETS,
    WIDGET_CATALOG,
    WIDGET_GROUPS,
    placementKey,
    type HomeData,
    type WidgetGroup,
    type WidgetKind,
    type WidgetPlacement,
    type WidgetSize,
} from "@/modules/progress/client";
import { cx } from "@/shared/ui/cx";
import { IconButton } from "@/shared/ui/icon-button";
import { PlusButton, PlusLabel } from "@/shared/ui/plus-button";
import { SectionLabel } from "@/shared/ui/section-label";
import { Sheet } from "@/shared/ui/sheet";
import { SizeSelector, SIZE_LETTERS } from "@/shared/ui/size-selector";
import { TextButton } from "@/shared/ui/text-button";
import { Toast } from "@/shared/ui/toast";

import { saveLayoutAction } from "../../_components/home-actions";

import { EntrySheet, type Entry } from "./entry-sheet";

type DashboardProps = {
    /** The top bar (wordmark, edit and theme buttons are added here). */
    themeToggle: ReactNode;
    hero: ReactNode;
    data: HomeData;
    initialLayout: WidgetPlacement[];
    /** Server-rendered content of every widget in every allowed size, by key and size. */
    renders: Record<string, Partial<Record<WidgetSize, ReactNode>>>;
    wordmark: ReactNode;
};

const GROUP_TITLES: Record<WidgetGroup, string> = {
    training: "Treino",
    body: "Corpo",
    habits: "Hábitos",
};
/** Matches --vita-duration-exit. */
const LEAVE_MS = 200;
const MAX_CUSTOM = 10;

function sizesText(sizes: readonly WidgetSize[]): string {
    return `tamanhos ${sizes.map((size) => SIZE_LETTERS[size]).join(" · ")}`;
}

function entryFor(placement: WidgetPlacement): Entry | null {
    if (placement.kind === "custom") {
        return placement.ref ? { kind: "custom", trackerId: placement.ref } : null;
    }
    if (!WIDGET_CATALOG[placement.kind].manual) {
        return null;
    }
    return { kind: placement.kind as Exclude<Entry["kind"], "custom" | "new_custom"> } as Entry;
}

export function Dashboard({
    themeToggle,
    hero,
    data,
    initialLayout,
    renders,
    wordmark,
}: DashboardProps) {
    const [layout, setLayout] = useState(initialLayout);
    const [saved, setSaved] = useState(initialLayout);
    const [editing, setEditing] = useState(false);
    const [adding, setAdding] = useState(false);
    const [entry, setEntry] = useState<Entry | null>(null);
    const [failed, setFailed] = useState(false);
    const [removing, setRemoving] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState("");
    const [, startTransition] = useTransition();

    // A server refresh (after an entry or a new tracker) brings a new layout only when not editing.
    const [seenInitial, setSeenInitial] = useState(initialLayout);
    if (initialLayout !== seenInitial) {
        setSeenInitial(initialLayout);
        if (!editing) {
            setLayout(initialLayout);
            setSaved(initialLayout);
        }
    }

    const nodes = useRef(new Map<string, HTMLElement>());
    const positions = useRef(new Map<string, { x: number; y: number }>());
    const animate = useRef(false);
    const drag = useRef<{
        key: string;
        pointerX: number;
        pointerY: number;
        scrollY: number;
        originX: number;
        originY: number;
    } | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);

    // FLIP: every widget that moved slides from where it was, with the settle spring.
    useLayoutEffect(() => {
        const next = new Map<string, { x: number; y: number }>();
        nodes.current.forEach((node, key) =>
            next.set(key, { x: node.offsetLeft, y: node.offsetTop }),
        );
        if (animate.current) {
            nodes.current.forEach((node, key) => {
                const before = positions.current.get(key);
                const now = next.get(key);
                if (!before || !now || key === drag.current?.key) {
                    return;
                }
                const dx = before.x - now.x;
                const dy = before.y - now.y;
                if (dx === 0 && dy === 0) {
                    return;
                }
                node.style.transition = "none";
                node.style.transform = `translate(${dx}px, ${dy}px)`;
                node.getBoundingClientRect();
                requestAnimationFrame(() => {
                    node.style.transition = "";
                    node.style.transform = "";
                });
            });
            animate.current = false;
        }
        positions.current = next;
        if (drag.current) {
            followPointer();
        }
    });

    function change(next: (current: WidgetPlacement[]) => WidgetPlacement[]) {
        animate.current = true;
        setLayout(next);
    }

    function move(key: string, to: number) {
        change((current) => {
            const from = current.findIndex((item) => placementKey(item) === key);
            if (from === -1 || to < 0 || to >= current.length || from === to) {
                return current;
            }
            const next = [...current];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
    }

    function remove(key: string) {
        setRemoving(key);
        setTimeout(() => {
            change((current) => current.filter((item) => placementKey(item) !== key));
            setRemoving(null);
        }, LEAVE_MS);
    }

    function finish() {
        const next = layout;
        setEditing(false);
        setAdding(false);
        startTransition(async () => {
            const result = await saveLayoutAction(next).catch(() => null);
            if (result) {
                setSaved(result);
            } else {
                setLayout(saved);
                setFailed(true);
            }
        });
    }

    /** Puts the dragged widget under the finger, wherever its slot is now. */
    function followPointer() {
        const state = drag.current;
        const node = state ? nodes.current.get(state.key) : undefined;
        if (!state || !node) {
            return;
        }
        const x = state.originX + state.pointerX;
        const y = state.originY + state.pointerY + (window.scrollY - state.scrollY);
        node.style.transition = "none";
        node.style.transform = `translate(${x - node.offsetLeft}px, ${y - node.offsetTop}px) scale(1.02)`;
    }

    function startDrag(key: string, event: PointerEvent<HTMLButtonElement>) {
        const node = nodes.current.get(key);
        if (!node) {
            return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = {
            key,
            pointerX: 0,
            pointerY: 0,
            scrollY: window.scrollY,
            originX: node.offsetLeft - event.clientX,
            originY: node.offsetTop - event.clientY,
        };
        drag.current.pointerX = event.clientX;
        drag.current.pointerY = event.clientY;
        setDragging(key);
        followPointer();
    }

    function moveDrag(event: PointerEvent<HTMLButtonElement>) {
        const state = drag.current;
        const node = state ? nodes.current.get(state.key) : undefined;
        if (!state || !node) {
            return;
        }
        state.pointerX = event.clientX;
        state.pointerY = event.clientY;
        if (event.clientY > window.innerHeight - 96) {
            window.scrollBy(0, 12);
        } else if (event.clientY < 96) {
            window.scrollBy(0, -12);
        }
        followPointer();
        // The widget under the dragged one's center takes its place.
        const centerX = state.originX + state.pointerX + node.offsetWidth / 2;
        const centerY =
            state.originY +
            state.pointerY +
            (window.scrollY - state.scrollY) +
            node.offsetHeight / 2;
        const target = layout.findIndex((item) => {
            const other = nodes.current.get(placementKey(item));
            return (
                other !== undefined &&
                placementKey(item) !== state.key &&
                centerX >= other.offsetLeft &&
                centerX <= other.offsetLeft + other.offsetWidth &&
                centerY >= other.offsetTop &&
                centerY <= other.offsetTop + other.offsetHeight
            );
        });
        if (target !== -1) {
            move(state.key, target);
        }
    }

    function endDrag() {
        const state = drag.current;
        const node = state ? nodes.current.get(state.key) : undefined;
        drag.current = null;
        setDragging(null);
        if (node) {
            node.style.transition = "";
            node.style.transform = "";
        }
    }

    function nudge(key: string, delta: number) {
        const index = layout.findIndex((item) => placementKey(item) === key);
        const to = index + delta;
        if (to < 0 || to >= layout.length) {
            return;
        }
        move(key, to);
        const title = titleOf(layout[index]);
        setAnnouncement(`${title}, posição ${to + 1} de ${layout.length}`);
    }

    function titleOf(item: WidgetPlacement): string {
        if (item.kind === "custom") {
            return (
                data.habits.custom.find((tracker) => tracker.id === item.ref)?.name ??
                "Personalizado"
            );
        }
        return WIDGET_CATALOG[item.kind].title;
    }

    function add(placement: WidgetPlacement) {
        change((current) => (current.length >= MAX_WIDGETS ? current : [...current, placement]));
        setAdding(false);
    }

    const onHome = new Set(layout.map(placementKey));
    const available = (Object.keys(WIDGET_CATALOG) as WidgetKind[]).filter(
        (kind) => kind !== "custom" && !onHome.has(kind),
    );
    const customOff = data.habits.custom.filter((tracker) => !onHome.has(`custom:${tracker.id}`));

    return (
        <>
            {editing ? (
                <div className="flex items-end justify-between gap-gutter">
                    <div className="flex flex-col gap-inner">
                        <p className="label">Editando</p>
                        <h1 className="headline text-28">Sua home</h1>
                    </div>
                    <TextButton tone="ink" onClick={finish}>
                        Concluir
                    </TextButton>
                </div>
            ) : (
                <div className="flex h-10 items-center justify-between gap-gutter">
                    {wordmark}
                    <div className="flex items-center gap-gutter">
                        <IconButton
                            icon="pencil"
                            onClick={() => setEditing(true)}
                            aria-label="Editar a home"
                        />
                        {themeToggle}
                    </div>
                </div>
            )}

            {!editing ? <div className="mt-intro">{hero}</div> : null}

            <div
                className={cx(
                    "relative grid grid-cols-2 gap-x-gutter",
                    editing ? "mt-block gap-y-edit" : "mt-section gap-y-section",
                )}
            >
                {layout.map((item) => {
                    const key = placementKey(item);
                    const definition = WIDGET_CATALOG[item.kind];
                    const content = renders[key]?.[item.size];
                    const manual = entryFor(item);
                    const title = titleOf(item);
                    return (
                        <article
                            key={key}
                            ref={(node) => {
                                if (node) {
                                    nodes.current.set(key, node);
                                } else {
                                    nodes.current.delete(key);
                                }
                            }}
                            aria-label={title}
                            className={cx(
                                "reflow relative min-w-0",
                                item.size === "small" ? "col-span-1" : "col-span-2",
                                dragging === key && "z-10",
                                removing === key && "opacity-0",
                            )}
                        >
                            {editing ? (
                                <div className="mb-label flex items-center justify-between gap-1">
                                    <button
                                        type="button"
                                        aria-label={`Mover ${title}. Setas para cima e para baixo.`}
                                        onPointerDown={(event) => startDrag(key, event)}
                                        onPointerMove={moveDrag}
                                        onPointerUp={endDrag}
                                        onPointerCancel={endDrag}
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "ArrowUp" ||
                                                event.key === "ArrowDown"
                                            ) {
                                                event.preventDefault();
                                                nudge(key, event.key === "ArrowUp" ? -1 : 1);
                                            }
                                        }}
                                        className="focus-ring tap-target flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center"
                                    >
                                        <span aria-hidden className="grid grid-cols-2 gap-[3px]">
                                            {Array.from({ length: 6 }, (_, index) => (
                                                <span
                                                    key={index}
                                                    className="size-[3px] rounded-full bg-ink"
                                                />
                                            ))}
                                        </span>
                                    </button>
                                    <SizeSelector
                                        label={`Tamanho de ${title}`}
                                        value={item.size}
                                        available={definition.sizes}
                                        onChange={(size) =>
                                            change((current) =>
                                                current.map((other) =>
                                                    placementKey(other) === key
                                                        ? { ...other, size }
                                                        : other,
                                                ),
                                            )
                                        }
                                    />
                                    <IconButton
                                        icon="minus"
                                        onClick={() => remove(key)}
                                        aria-label={`Remover ${title}`}
                                    />
                                </div>
                            ) : null}
                            <div className="relative">
                                {editing ? <CornerMarks /> : null}
                                <div
                                    key={item.size}
                                    className={cx(editing && "pointer-events-none fade-in")}
                                >
                                    {manual && !editing ? (
                                        <button
                                            type="button"
                                            onClick={() => setEntry(manual)}
                                            aria-label={`Registrar ${title}`}
                                            className="pressable focus-ring block w-full text-left"
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        (content ?? <p className="label opacity-40">{title}</p>)
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {editing ? (
                <div className="mt-edit">
                    <PlusButton size={32} onClick={() => setAdding(true)}>
                        Adicionar widget
                    </PlusButton>
                </div>
            ) : null}

            <p aria-live="polite" className="sr-only">
                {announcement}
            </p>

            <Sheet open={adding} onClose={() => setAdding(false)} title="Adicionar">
                <div className="flex flex-col gap-block">
                    {WIDGET_GROUPS.map((group) => {
                        const kinds = available.filter(
                            (kind) => WIDGET_CATALOG[kind].group === group,
                        );
                        const extra = group === "habits";
                        if (kinds.length === 0 && !extra) {
                            return null;
                        }
                        return (
                            <section key={group} className="flex flex-col gap-label">
                                <SectionLabel>{GROUP_TITLES[group]}</SectionLabel>
                                <ul className="flex flex-col gap-inner">
                                    {kinds.map((kind) => (
                                        <AddRow
                                            key={kind}
                                            name={WIDGET_CATALOG[kind].title}
                                            sizes={WIDGET_CATALOG[kind].sizes}
                                            onAdd={() =>
                                                add({
                                                    kind,
                                                    size: WIDGET_CATALOG[kind].sizes[0],
                                                    ref: null,
                                                })
                                            }
                                        />
                                    ))}
                                    {extra
                                        ? customOff.map((tracker) => (
                                              <AddRow
                                                  key={tracker.id}
                                                  name={tracker.name}
                                                  sizes={WIDGET_CATALOG.custom.sizes}
                                                  onAdd={() =>
                                                      add({
                                                          kind: "custom",
                                                          size: "small",
                                                          ref: tracker.id,
                                                      })
                                                  }
                                              />
                                          ))
                                        : null}
                                    {extra && data.habits.custom.length < MAX_CUSTOM ? (
                                        <AddRow
                                            name="Personalizado"
                                            sizes={WIDGET_CATALOG.custom.sizes}
                                            onAdd={() => {
                                                setAdding(false);
                                                setEntry({ kind: "new_custom" });
                                            }}
                                        />
                                    ) : null}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </Sheet>

            <EntrySheet
                entry={entry}
                data={data}
                onClose={() => setEntry(null)}
                onFailed={() => setFailed(true)}
                onCreated={(trackerId) => {
                    const next = [
                        ...layout,
                        { kind: "custom" as const, size: "small" as const, ref: trackerId },
                    ];
                    change(() => next);
                    startTransition(async () => {
                        const result = await saveLayoutAction(next).catch(() => null);
                        if (result) {
                            setSaved(result);
                        } else {
                            setFailed(true);
                        }
                    });
                }}
            />

            {failed ? (
                <Toast
                    message="Não foi possível salvar. Tente de novo."
                    actionLabel="Fechar"
                    onAction={() => setFailed(false)}
                    onDismiss={() => setFailed(false)}
                />
            ) : null}
        </>
    );
}

function AddRow({
    name,
    sizes,
    onAdd,
}: {
    name: string;
    sizes: readonly WidgetSize[];
    onAdd: () => void;
}) {
    return (
        <li>
            <button
                type="button"
                onClick={onAdd}
                aria-label={`Adicionar ${name}`}
                className="pressable focus-ring flex min-h-14 w-full items-center justify-between gap-gutter text-left"
            >
                <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-17 font-semibold">{name}</span>
                    <span className="text-11 font-semibold text-secondary">{sizesText(sizes)}</span>
                </span>
                <PlusLabel size={32} />
            </button>
        </li>
    );
}

/** Four L-shaped marks of 3px dots at 35% ink, 8px outside each corner. Marks, not borders. */
function CornerMarks() {
    const dots = [
        [0, 0],
        [6, 0],
        [12, 0],
        [0, 6],
        [0, 12],
    ];
    const corners = [
        { className: "-left-2 -top-2", flip: "" },
        { className: "-right-2 -top-2", flip: "scale-x-[-1]" },
        { className: "-bottom-2 -left-2", flip: "scale-y-[-1]" },
        { className: "-bottom-2 -right-2", flip: "scale-[-1]" },
    ];
    return (
        <span aria-hidden className="pointer-events-none absolute inset-0">
            {corners.map((corner) => (
                <span
                    key={corner.className}
                    className={cx("absolute size-[15px]", corner.className, corner.flip)}
                >
                    {dots.map(([x, y]) => (
                        <span
                            key={`${x}-${y}`}
                            className="absolute size-[3px] rounded-full bg-ink opacity-35"
                            style={{ left: x, top: y }}
                        />
                    ))}
                </span>
            ))}
        </span>
    );
}
