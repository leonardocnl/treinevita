import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getOpenSession } from "@/modules/logging";
import { getWorkoutView, type WorkoutView } from "@/modules/progress";
import { requireAppContext } from "@/modules/tenancy";
import { timed } from "@/platform/db/timing";

/**
 * Loads the workout in progress (once per request, React cache), or sends back
 * to the Summary when there is none.
 */
export const loadOpenWorkout = cache((route: string): Promise<WorkoutView> =>
    timed(route, async () => {
        const context = await requireAppContext();
        const session = await getOpenSession(context);
        if (!session) {
            redirect("/");
        }
        return getWorkoutView(context, session);
    }),
);
