/**
 * Public API of the catalog module. Other modules import only from here.
 * Exercise catalog (global and per-workspace), muscle groups and demonstrations.
 */
export {
    getExercisesByIds,
    getGlobalExercisesBySlug,
    listGlobalExercises,
    type CatalogEntry,
    type CatalogExercise,
    type ExerciseMedia,
    type GlobalExerciseRef,
} from "./application/exercises";
