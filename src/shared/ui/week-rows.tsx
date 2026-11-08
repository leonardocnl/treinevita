/*
 * Consistency, one row per week (newest first): the week's label, the goal as
 * dots lit by each workout, and a short red bar when the goal was met. The week
 * still running shows its empty slots as outlines.
 */
import { DotMeter } from "./dot-meter";
import { List, ListRow } from "./list";

export type Week = {
    /** First day of the week, YYYY-MM-DD. */
    start: string;
    trained: number;
    current: boolean;
};

type WeekRowsProps = {
    weeks: readonly Week[];
    goal: number;
    /** regular: 8px dots in 24px rows; large: 11px dots in 30px rows. */
    size?: "regular" | "large";
};

/** "Esta semana" for the current week, otherwise the start date ("3 nov"). */
export function weekLabel(week: Pick<Week, "start" | "current">): string {
    if (week.current) {
        return "Esta semana";
    }
    return new Date(`${week.start}T12:00:00Z`)
        .toLocaleDateString("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" })
        .replace(".", "");
}

export function WeekRows({ weeks, goal, size = "regular" }: WeekRowsProps) {
    const large = size === "large";
    return (
        <List>
            {weeks.map((week) => (
                <ListRow
                    key={week.start}
                    className="grid grid-cols-[1fr_auto_18px] items-center gap-3"
                    style={{ height: large ? 30 : 24 }}
                >
                    <span
                        className={`truncate text-[13px] ${week.current ? "text-ink" : "text-ink-secondary"}`}
                    >
                        {weekLabel(week)}
                    </span>
                    <DotMeter
                        total={Math.max(goal, week.trained)}
                        done={week.trained}
                        size={large ? 11 : 8}
                        hollow={week.current}
                        label={`${week.trained} de ${goal} treinos`}
                    />
                    <span className="flex justify-end">
                        {week.trained >= goal ? (
                            <span
                                role="img"
                                aria-label="meta batida"
                                className="h-[3px] w-3.5 rounded-full bg-red"
                            />
                        ) : null}
                    </span>
                </ListRow>
            ))}
        </List>
    );
}
