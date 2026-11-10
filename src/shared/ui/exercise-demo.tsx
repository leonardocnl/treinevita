/*
 * How an exercise is done: the start and end drawings taking turns with a soft
 * crossfade. With reduced motion both poses sit side by side, still. The
 * drawings are files used as masks over the ink color, so they follow the
 * theme. The link to see it done lives in the screen's header (external-link icon).
 */
import type { CSSProperties } from "react";

type Media = { readonly start: string; readonly end: string };

function maskStyle(src: string): CSSProperties {
    const url = `url("${src}")`;
    return { maskImage: url, WebkitMaskImage: url };
}

/** A YouTube search for the exercise, by its Portuguese name. */
export function youtubeSearchUrl(name: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} execução`)}`;
}

type ExerciseDemoProps = {
    /** The exercise name in Portuguese: labels the drawing. */
    name: string;
    media: Media | null;
    /** Height in px: 152 on the set screen, larger in its full-screen sheet. */
    height?: number;
};

export function ExerciseDemo({ name, media, height = 152 }: ExerciseDemoProps) {
    if (!media) {
        return null;
    }
    return (
        <div
            role="img"
            aria-label={`${name}: posição inicial e final`}
            className="relative w-full text-ink motion-reduce:grid motion-reduce:grid-cols-2 motion-reduce:gap-gutter"
            style={{ height }}
        >
            <span
                className="pose pose-cycle absolute inset-0 motion-reduce:static motion-reduce:animate-none"
                style={maskStyle(media.start)}
            />
            <span
                className="pose pose-cycle absolute inset-0 [animation-delay:-1.2s] motion-reduce:static motion-reduce:animate-none"
                style={maskStyle(media.end)}
            />
        </div>
    );
}

/** The start pose, small and still, for exercise lists. Decorative. */
export function ExerciseThumb({ media }: { media: Media | null }) {
    if (!media) {
        return <span aria-hidden className="size-10 shrink-0" />;
    }
    return (
        <span
            aria-hidden
            className="pose size-10 shrink-0 text-secondary"
            style={maskStyle(media.start)}
        />
    );
}
