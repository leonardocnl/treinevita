"use client";

/*
 * A single line of text: the 11px label over a tappable 64px tint field
 * (radius 20) with the value at 20px. Tappable, so it has a fill; no border.
 */
import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "id">;

export function TextField({ label, value, onChange, ...rest }: TextFieldProps) {
    const id = useId();
    return (
        <div className="flex flex-col gap-label">
            <label htmlFor={id} className="label">
                {label}
            </label>
            <input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="focus-ring h-16 w-full rounded-cta bg-tint px-margin text-20 font-semibold text-ink placeholder:text-secondary"
                {...rest}
            />
        </div>
    );
}
