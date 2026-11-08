"use client";

/*
 * A single line of text on the canvas: a 13px label and a large, thin input
 * over a hairline that turns ink while focused. No box around it.
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
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-[13px] text-ink-secondary">
                {label}
            </label>
            <input
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-none border-b border-hairline bg-transparent pb-2 text-[28px] font-light text-ink outline-none transition-colors placeholder:text-dot-off focus:border-ink"
                {...rest}
            />
        </div>
    );
}
