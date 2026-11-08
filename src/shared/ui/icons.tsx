/*
 * The VITA icon set: 24×24 line icons in currentColor with round caps and joins.
 * One component, one API: <Icon name="check" size={20} />. Icons are always
 * decorative (aria-hidden); the button around them carries the label.
 */
import type { ReactNode } from "react";

type IconDefinition = {
    /** Default stroke width; ignored by filled icons. */
    stroke?: number;
    filled?: boolean;
    /** Default size when the caller gives none. */
    size?: number;
    shape: ReactNode;
};

const icons = {
    summary: {
        shape: (
            <>
                <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
                <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
                <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
                <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
            </>
        ),
    },
    dumbbell: { shape: <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" /> },
    chart: {
        shape: (
            <>
                <path d="M4 4v16h16" />
                <path d="M8 15l4-4 3 3 5-6" />
            </>
        ),
    },
    scale: {
        shape: (
            <>
                <rect x="4" y="4" width="16" height="16" rx="4.5" />
                <path d="M8.5 10.5a3.5 3.5 0 0 1 7 0" />
                <path d="M12 10.5l1.6-2" />
            </>
        ),
    },
    "arrow-right": { stroke: 2.4, shape: <path d="M5 12h14M13 6l6 6-6 6" /> },
    "arrow-up": { stroke: 2.8, shape: <path d="M12 19V5M6 11l6-6 6 6" /> },
    check: { stroke: 2.6, shape: <path d="M5 12.5l4.5 4.5L19 7.5" /> },
    "chevron-left": { stroke: 2, shape: <path d="M15 5l-7 7 7 7" /> },
    "chevron-right": { stroke: 2, shape: <path d="M9 5l7 7-7 7" /> },
    minus: { stroke: 2.4, shape: <path d="M6 12h12" /> },
    plus: { stroke: 2.4, shape: <path d="M12 6v12M6 12h12" /> },
    settings: {
        shape: (
            <>
                <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                <circle cx="15" cy="7" r="2" />
                <circle cx="9" cy="17" r="2" />
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
    play: { filled: true, size: 18, shape: <path d="M8 5.5v13l11-6.5z" /> },
    "tile-small": {
        filled: true,
        size: 16,
        shape: <rect x="8" y="8" width="8" height="8" rx="2" />,
    },
    "tile-medium": {
        filled: true,
        size: 16,
        shape: <rect x="4" y="8" width="16" height="8" rx="2" />,
    },
    "tile-large": {
        filled: true,
        size: 16,
        shape: <rect x="5" y="5" width="14" height="14" rx="3" />,
    },
} satisfies Record<string, IconDefinition>;

export type IconName = keyof typeof icons;

export const ICON_NAMES = Object.keys(icons) as IconName[];

type IconProps = {
    name: IconName;
    /** Width and height in px. Defaults to 22 (18 for play, 16 for the tile shapes). */
    size?: number;
    /** Overrides the icon's own stroke width (line icons only). */
    strokeWidth?: number;
};

export function Icon({ name, size, strokeWidth }: IconProps) {
    const icon: IconDefinition = icons[name];
    const side = size ?? icon.size ?? 22;
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
            strokeWidth={strokeWidth ?? icon.stroke ?? 1.9}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            {icon.shape}
        </svg>
    );
}
