/** Joins class names, skipping empty ones. Keeps every class in a plain literal Tailwind can find. */
export function cx(...classes: (string | false | null | undefined)[]): string {
    return classes.filter(Boolean).join(" ");
}
