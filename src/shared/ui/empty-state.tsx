/*
 * The empty state of a widget: a ghost Doto value at 15% opacity in the exact
 * place of the real value ("0/4", "00 kg"), one sentence saying what will appear
 * there and, for manual data, a "+ REGISTRAR …" label (its parent is the button).
 */
import type { ReactNode } from "react";

import { DotNumber, type DotNumberSize } from "./dot-number";
import { PlusLabel } from "./plus-button";

type EmptyStateProps = {
    /** The ghost value, shaped like the real one. */
    ghost: ReactNode;
    size?: DotNumberSize;
    unit?: ReactNode;
    of?: ReactNode;
    sentence: string;
    /** "Registrar peso": shown with the plus mark, for manual data. */
    action?: string;
};

export function EmptyState({ ghost, size = 56, unit, of, sentence, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col gap-inner">
            <DotNumber as="p" size={size} unit={unit} of={of} ghost>
                {ghost}
            </DotNumber>
            <p className="text-13 text-secondary">{sentence}</p>
            {action ? <PlusLabel>{action}</PlusLabel> : null}
        </div>
    );
}
