/*
 * How an exercise is done: the start and end drawings taking turns with a soft
 * crossfade, and a "Ver no YouTube" link. With reduced motion both poses sit
 * side by side, still. Without drawings, only the link. The drawings are files
 * used as masks over the ink color, so they follow the theme.
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
    /** The exercise name in Portuguese: labels the drawing and feeds the search. */
    name: string;
    media: Media | null;
};

export function ExerciseDemo({ name, media }: ExerciseDemoProps) {
    return (
        <figure className="flex flex-col items-center gap-3">
            {media ? (
                <div
                    role="img"
                    aria-label={`${name}: posição inicial e final`}
                    className="relative h-44 w-full text-ink motion-reduce:grid motion-reduce:grid-cols-2 motion-reduce:gap-4"
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
            ) : null}
            <a
                href={youtubeSearchUrl(name)}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable text-[15px] font-normal text-ink-secondary"
            >
                Ver no YouTube
            </a>
        </figure>
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
            className="pose size-10 shrink-0 text-ink-secondary"
            style={maskStyle(media.start)}
        />
    );
}
