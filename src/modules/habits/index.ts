/**
 * Public API of the habits module. Other modules and routes import only from here.
 * Manual trackers (sleep, water, steps, energy, custom) and their daily entries.
 */
export {
    createCustomTracker,
    getHabits,
    logHabit,
    ownCustomTrackerIds,
    type Habits,
    type LogHabitInput,
    type Tracker,
} from "./application/habits";
export {
    BUILT_IN_KINDS,
    CUSTOM_NAME,
    DEFAULT_GOALS,
    MAX_CUSTOM_TRACKERS,
    RANGES,
    TRACKER_KINDS,
    VALUE_TYPES,
    averageOf,
    customTrackerSchema,
    isDayDone,
    weekEntries,
    type BuiltInKind,
    type CustomTrackerInput,
    type Entry,
    type TrackerKind,
    type ValueType,
} from "./domain/trackers";
