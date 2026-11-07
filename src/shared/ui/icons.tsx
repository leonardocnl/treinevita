import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps): SVGProps<SVGSVGElement> {
    return {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.9,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
        ...props,
    };
}

export function SummaryIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
            <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
    );
}

export function DumbbellIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11" />
        </svg>
    );
}

export function ChartIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M4 4v16h16" />
            <path d="M8 15l4-4 3 3 5-6" />
        </svg>
    );
}

export function ScaleIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <rect x="4" y="4" width="16" height="16" rx="4.5" />
            <path d="M8.5 10.5a3.5 3.5 0 0 1 7 0" />
            <path d="M12 10.5l1.6-2" />
        </svg>
    );
}

export function ArrowRightIcon(props: IconProps) {
    return (
        <svg {...base({ strokeWidth: 2.4, ...props })}>
            <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
    );
}

export function ArrowUpIcon(props: IconProps) {
    return (
        <svg {...base({ strokeWidth: 2.8, ...props })}>
            <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
    );
}

export function CheckIcon(props: IconProps) {
    return (
        <svg {...base({ strokeWidth: 2.6, ...props })}>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
    );
}

export function ChevronLeftIcon(props: IconProps) {
    return (
        <svg {...base({ strokeWidth: 2, ...props })}>
            <path d="M15 5l-7 7 7 7" />
        </svg>
    );
}

export function PlayIcon(props: IconProps) {
    const { size = 18, ...rest } = props;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            {...rest}
        >
            <path d="M8 5.5v13l11-6.5z" />
        </svg>
    );
}

export function UndoIcon(props: IconProps) {
    return (
        <svg {...base(props)}>
            <path d="M9 14l-5-5 5-5" />
            <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
        </svg>
    );
}
