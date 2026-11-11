/*
 * The VITA icon set (design v2): a 24×24 grid, 1.75px line in currentColor,
 * round caps and joins, no fill . One component, one API: <Icon name="check" size={20} />.
 * Icons are always decorative (aria-hidden); the button around them carries
 * the label in Portuguese.
 */
import type { ReactNode } from "react";

const STROKE = 1.75;

type IconDefinition = {
    filled?: boolean;
    /** Default size when the caller gives none. */
    size?: number;
    shape: ReactNode;
};

const icons = {
    /* Actions */
    "arrow-right": { shape: <path d="M5 12h14M13 6l6 6-6 6" /> },
    check: { shape: <path d="M5 12.5l4.5 4.5L19 7.5" /> },
    "chevron-left": { shape: <path d="M15 5l-7 7 7 7" /> },
    "chevron-right": { shape: <path d="M9 5l7 7-7 7" /> },
    close: { shape: <path d="M6 6l12 12M18 6L6 18" /> },
    minus: { shape: <path d="M6 12h12" /> },
    plus: { shape: <path d="M12 6v12M6 12h12" /> },
    pencil: {
        shape: (
            <>
                <path d="M4.5 19.5l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L9 18.5z" />
                <path d="M13.5 7l3.5 3.5" />
            </>
        ),
    },
    /** An arrow leaving a box, up and to the right: opens another site in a new tab. */
    "external-link": {
        shape: (
            <>
                <path d="M13 5h6v6" />
                <path d="M19 5l-8.5 8.5" />
                <path d="M17 14v3.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 17.5v-9A1.5 1.5 0 0 1 6.5 7H10" />
            </>
        ),
    },
    trash: {
        shape: (
            <>
                <path d="M4.5 7h15M10 4h4" />
                <path d="M6.5 7l.8 11.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
            </>
        ),
    },
    undo: {
        shape: (
            <>
                <path d="M9 14l-5-5 5-5" />
                <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
            </>
        ),
    },
    sun: {
        shape: (
            <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
            </>
        ),
    },
    moon: { shape: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /> },
    /** A door with an arrow leaving it: sign out. */
    "sign-out": {
        shape: (
            <>
                <path d="M14 4.5h3.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H14" />
                <path d="M10 8l-4 4 4 4M6 12h9" />
            </>
        ),
    },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;

export const ICON_NAMES = Object.keys(icons) as IconName[];

type IconProps = {
    name: IconName;
    /** Width and height in px. Defaults to 24. */
    size?: number;
};

export function Icon({ name, size }: IconProps) {
    const icon: IconDefinition = icons[name];
    const side = size ?? icon.size ?? 24;
    if (icon.filled) {
        return (
            <svg width={side} height={side} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                {icon.shape}
            </svg>
        );
    }
    return (
        <svg
            width={side}
            height={side}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {icon.shape}
        </svg>
    );
}
