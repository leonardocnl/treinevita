/*
 * Text in Inter: Title (display and page titles), Label (body text at 15 or 17px)
 * and Caption (small secondary text at 13px, 11px for chart axes).
 * Color and weight come from props; `className` is only for layout
 * (margins, truncation, leading, alignment).
 */
import type { ReactNode } from "react";

export type TextTone = "primary" | "secondary" | "accent" | "inherit";
export type TextWeight = "light" | "normal" | "medium";

const toneClass: Record<TextTone, string> = {
    primary: "text-ink",
    secondary: "text-ink-secondary",
    accent: "text-red-text",
    inherit: "",
};

const weightClass: Record<TextWeight, string> = {
    light: "font-light",
    normal: "font-normal",
    medium: "font-medium",
};

type TextProps = {
    children: ReactNode;
    /** Text color; "inherit" (the default, except on Caption) keeps the color around it. */
    tone?: TextTone;
    /** Font weight; without it the text inherits (300 on the page). */
    weight?: TextWeight;
    className?: string;
    id?: string;
    role?: "alert";
};

function classes(base: string, tone?: TextTone, weight?: TextWeight, className?: string) {
    return [base, tone && toneClass[tone], weight && weightClass[weight], className]
        .filter(Boolean)
        .join(" ");
}

const titleSize = {
    22: "text-[22px]",
    28: "text-[28px]",
    30: "text-[30px]",
    32: "text-[32px]",
    34: "text-[34px]",
    40: "text-[40px]",
} as const;

const titleLeading = {
    none: "leading-none",
    tight: "leading-tight",
    "1.08": "leading-[1.08]",
    "1.1": "leading-[1.1]",
} as const;

type TitleProps = TextProps & {
    as?: "h1" | "h2" | "h3" | "p";
    size: keyof typeof titleSize;
    leading?: keyof typeof titleLeading;
};

/** Titles from 22 to 40px: page titles, widget heroes ("Treino A"), sheet titles. */
export function Title({
    as: Tag = "h1",
    size,
    leading,
    tone,
    weight,
    className,
    ...rest
}: TitleProps) {
    const base = [titleSize[size], leading && titleLeading[leading]].filter(Boolean).join(" ");
    return <Tag className={classes(base, tone, weight, className)} {...rest} />;
}

type LabelProps = TextProps & {
    as?: "p" | "span";
    size?: 15 | 17;
};

/** Body text: 15px by default (subtitles, buttons, rows), 17px for list names and leads. */
export function Label({ as: Tag = "p", size = 15, tone, weight, className, ...rest }: LabelProps) {
    const base = size === 15 ? "text-[15px]" : "text-[17px]";
    return <Tag className={classes(base, tone, weight, className)} {...rest} />;
}

type CaptionProps = TextProps & {
    as?: "p" | "span" | "h2";
    size?: 11 | 13;
};

/** Small text: widget titles, units, status lines. Secondary color by default. */
export function Caption({
    as: Tag = "p",
    size = 13,
    tone = "secondary",
    weight,
    className,
    ...rest
}: CaptionProps) {
    const base = size === 13 ? "text-[13px]" : "text-[11px]";
    return <Tag className={classes(base, tone, weight, className)} {...rest} />;
}
