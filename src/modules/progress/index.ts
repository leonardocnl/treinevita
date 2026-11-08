/**
 * Public API of the progress module. Other modules import only from here.
 */
export { getDashboardLayout, saveDashboardLayout } from "./application/dashboard";
export {
    getDashboardExtras,
    type DashboardExtras,
    type RecordEntry,
    type WeekDay,
} from "./application/dashboard-data";
export { recordBodyWeight } from "./application/body-weight";
export { startNextWorkout } from "./application/start-workout";
export {
    DEFAULT_LAYOUT,
    MAX_WIDGETS,
    WIDGET_CATALOG,
    WIDGET_KINDS,
    WIDGET_SIZES,
    sanitizeLayout,
    type WidgetDefinition,
    type WidgetKind,
    type WidgetPlacement,
    type WidgetSize,
} from "./domain/widgets";
export {
    ACTIVITY_WEEKS,
    getSummary,
    type ActivityDay,
    type CalendarDay,
    type Summary,
} from "./application/summary";
export { getWorkoutView, type ExerciseView, type WorkoutView } from "./application/workout-view";
export {
    doubleProgression,
    noProgression,
    progressionStrategies,
    type AskReason,
    type LoadDecision,
    type ProgressionStrategy,
    type RepRange,
} from "./domain/progression";
export { isStagnant, type WeeklyBest } from "./domain/stagnation";
export {
    bestOneRepMax,
    estimateOneRepMax,
    isEffectiveSet,
    setVolume,
    type LoggedSet,
    type SetType,
} from "./domain/strength";
export { weeklySetsByMuscle, type MuscleRole, type SetWithMuscles } from "./domain/volume";
