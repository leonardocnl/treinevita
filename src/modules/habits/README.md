# habits

Manual trackers on the home: sleep, water, steps (with cardio minutes), energy before training, and the person's own custom trackers (yes/no, a number with a unit, or a time), each with a goal and one entry per day.

Sleep and energy are health-related data (LGPD): only what the widgets show is stored, nothing here is logged, and export and deletion are required before the app opens to other people (ADR 0013).

## Layers

- `domain/`: pure rules: tracker kinds, value types, strict ranges, default goals, weekly and daily summaries.
- `application/`: use cases; receives a `TenantContext` and calls the repositories.
- `infrastructure/`: Drizzle tables (`schema.ts`). Only this module touches its tables.

## Public API

Everything other modules and routes may use is exported from `index.ts`.
