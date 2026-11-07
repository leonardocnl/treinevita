/*
 * The "vita" wordmark in dots at 20px: the one place the dot-matrix font goes
 * under 36px, on purpose (it is a logo, not data).
 */
export function Wordmark({ label }: { label?: string }) {
    return (
        <p className="num text-[20px]" aria-label={label}>
            vita
        </p>
    );
}
