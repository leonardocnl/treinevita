/**
 * Client-safe part of the progress module's public API: pure domain code only,
 * for client components (the home's edit mode). Server code stays in index.ts.
 */
export {
    MAX_WIDGETS,
    WIDGET_CATALOG,
    WIDGET_GROUPS,
    placementKey,
    type WidgetDefinition,
    type WidgetGroup,
    type WidgetKind,
    type WidgetPlacement,
    type WidgetSize,
} from "./domain/widgets";
export type { HomeData } from "./application/home";
