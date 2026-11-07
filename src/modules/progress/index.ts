/**
 * Public API of the progress module. Other modules import only from here.
 */
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
