"use client";

/*
 * "Descartar treino": a trash icon that asks first, in a sheet, before the
 * open workout and its sets are deleted. Never a browser dialog.
 */
import { useState } from "react";

import { IconButton } from "@/shared/ui/icon-button";
import { PrimaryAction } from "@/shared/ui/primary-action";
import { Sheet } from "@/shared/ui/sheet";

import { discardWorkoutAction } from "../../_components/actions";

export function DiscardWorkout() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <IconButton icon="trash" onClick={() => setOpen(true)} aria-label="Descartar treino" />
            <Sheet open={open} onClose={() => setOpen(false)} title="Descartar treino">
                <p className="text-17">
                    O treino em andamento e as séries registradas nele são apagados.
                </p>
                <form action={discardWorkoutAction} className="mt-block">
                    <PrimaryAction type="submit" glyph="check" label="Descartar" />
                </form>
            </Sheet>
        </>
    );
}
