"use client";

/*
 * A single line of text on the canvas: a 13px label and a large, thin input
 * over a hairline. While focused an ink line draws over the hairline from the
 * left (scaleX, so nothing but transform moves). No box around it.
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
            <div className="group relative">
                <input
                    id={id}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="w-full rounded-none border-b border-hairline bg-transparent pb-2 text-[28px] font-light text-ink outline-none placeholder:text-ink-tertiary"
                    {...rest}
                />
                <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-ink transition-transform duration-200 ease-enter group-focus-within:scale-x-100"
                />
            </div>
        </div>
    );
}
