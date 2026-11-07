# progress

Progression rules, strength math, stagnation, weekly volume, body measurements and dashboard widgets.

## Layers

- `domain/`: pure business rules, no framework or database.
- `application/`: use cases; receives a `TenantContext` and calls repositories.
- `infrastructure/`: Drizzle tables (`schema.ts`) and repositories. Only this module touches its tables.
- `ui/`: React components of this subject.

## Public API

Everything other modules may use is exported from `index.ts`. Importing any other file of this module from outside is blocked by dependency-cruiser.
