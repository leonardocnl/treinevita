"use client";

/*
 * "Descartar treino": a trash icon that asks first, in a sheet, before the
 * open workout and its sets are deleted. Never a browser dialog.
 */
import { useState } from "react";

import { GlassIconButton } from "@/shared/ui/glass-icon-button";
import { Icon } from "@/shared/ui/icons";
import { PillAction } from "@/shared/ui/pill-action";
import { Sheet } from "@/shared/ui/sheet";
import { Label } from "@/shared/ui/text";

import { discardWorkoutAction } from "../../_components/actions";

export function DiscardWorkout() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <GlassIconButton onClick={() => setOpen(true)} aria-label="Descartar treino">
                <Icon name="trash" size={20} />
            </GlassIconButton>
            <Sheet open={open} onClose={() => setOpen(false)} title="Descartar treino">
                <Label size={17} className="mt-2">
                    O treino em andamento e as séries registradas nele são apagados.
                </Label>
                <form action={discardWorkoutAction} className="mt-6">
                    <PillAction type="submit" icon={<Icon name="trash" size={20} />}>
                        Descartar treino
                    </PillAction>
                </form>
            </Sheet>
        </>
    );
}
