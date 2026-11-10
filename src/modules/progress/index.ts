/**
 * Public API of the progress module. Other modules import only from here.
 */
export { getDashboardLayout, saveDashboardLayout } from "./application/dashboard";
export { getHome, type HomeData } from "./application/home";
export {
    getWeightTrend,
    measurementsSchema,
    recordMeasurements,
    type MeasurementsInput,
} from "./application/body";
export { createGoal, deleteGoal, listGoals, type Goal } from "./application/goals";
export { recordBodyWeight } from "./application/body-weight";
export { startNextWorkout } from "./application/start-workout";
export {
    DEFAULT_LAYOUT,
    MAX_WIDGETS,
    WIDGET_CATALOG,
    WIDGET_GROUPS,
    WIDGET_KINDS,
    WIDGET_SIZES,
    isValidLayout,
    placementKey,
    sanitizeLayout,
    type WidgetDefinition,
    type WidgetGroup,
    type WidgetKind,
    type WidgetPlacement,
    type WidgetSize,
} from "./domain/widgets";
export { GOAL_KINDS, MAX_GOALS, goalSchema, type GoalInput, type GoalKind } from "./domain/goals";
export {
    STAGNATION_WEEKS,
    hoursAndMinutes,
    weeksSinceProgress,
    type WeeklyTop,
} from "./domain/metrics";
export { getWorkoutView, type ExerciseView, type WorkoutView } from "./application/workout-view";
export { getWorkoutSummary, type WorkoutSummary } from "./application/workout-summary";
export {
    doubleProgression,
    noProgression,
    progressionStrategies,
    type AskReason,
    type LoadDecision,
    type ProgressionStrategy,
    type RepRange,
} from "./domain/progression";
export {
    bestOneRepMax,
    estimateOneRepMax,
    isEffectiveSet,
    setVolume,
    type LoggedSet,
    type SetType,
} from "./domain/strength";
export { weeklySetsByMuscle, type MuscleRole, type SetWithMuscles } from "./domain/volume";
