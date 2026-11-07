/** Calendar helpers that respect the person's time zone. Dates are "YYYY-MM-DD" strings. */

export function toLocalDate(instant: Date, timezone: string): string {
    return instant.toLocaleDateString("en-CA", { timeZone: timezone });
}

export function addDays(localDate: string, days: number): string {
    const date = new Date(`${localDate}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/** Monday of the week that contains the date. */
export function startOfWeek(localDate: string): string {
    const day = new Date(`${localDate}T12:00:00Z`).getUTCDay();
    const offset = day === 0 ? -6 : 1 - day;
    return addDays(localDate, offset);
}

export function startOfMonth(localDate: string): string {
    return `${localDate.slice(0, 7)}-01`;
}

export function daysInMonth(localDate: string): number {
    const [year, month] = localDate.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(localDate: string): number {
    const day = new Date(`${localDate}T12:00:00Z`).getUTCDay();
    return day === 0 ? 6 : day - 1;
}

/** "sábado, 7 de novembro" */
export function formatLongDate(localDate: string): string {
    const text = new Date(`${localDate}T12:00:00Z`).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "UTC",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function monthName(localDate: string): string {
    const text = new Date(`${localDate}T12:00:00Z`).toLocaleDateString("pt-BR", {
        month: "long",
        timeZone: "UTC",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}
