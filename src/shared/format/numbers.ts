/** "37,5", "35", "62,4" — Brazilian decimal comma, no trailing zeros. */
export function formatNumber(value: number, maxFractionDigits = 2, minFractionDigits = 0): string {
    return value.toLocaleString("pt-BR", {
        maximumFractionDigits: maxFractionDigits,
        minimumFractionDigits: minFractionDigits,
    });
}

/** "1:05" for 65 seconds, "45 s" below a minute. */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds} s`;
    }
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** "1 de 1 série", "2 de 4 séries": how many sets of the target are done. */
export function setsLabel(done: number, total: number): string {
    return `${done} de ${total} ${total === 1 ? "série" : "séries"}`;
}
