/*
 * What a widget or list says when it has nothing to show: one sentence in
 * secondary text, pushed to the bottom, saying what to do next.
 */
export function EmptyState({ children }: { children: string }) {
    return <p className="mt-auto text-[15px] leading-snug text-ink-secondary">{children}</p>;
}
