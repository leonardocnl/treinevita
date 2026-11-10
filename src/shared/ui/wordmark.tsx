/*
 * The "vita" wordmark in Doto at 24px: the one place the dot font goes under
 * 36px, on purpose (it is a logo, not data).
 */
export function Wordmark({ label = "VITA" }: { label?: string }) {
    return (
        <p className="num text-24 leading-none" aria-label={label}>
            vita
        </p>
    );
}
