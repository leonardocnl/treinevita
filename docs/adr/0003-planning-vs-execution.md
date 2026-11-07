# ADR 0003: Planning separated from execution

## Status

Accepted, 2026-11-07.

## Decision

- `training` owns the plan: programs → workouts (A, B, C) → prescribed exercises.
- `logging` owns what happened: workout sessions → performed exercises → performed sets.
- Each performed exercise stores a **snapshot of the prescription** at training time. Editing or archiving a plan never rewrites history.
- `performed_sets.set_type` (`warmup`, `working`, `drop`, `failure`) allows drop sets and others later without a migration.

## Foreign keys across modules

Table files may reference other modules' tables only for foreign keys: to `identity` (users), `tenancy` (workspaces), `catalog` (exercises) and, for `logging`, to `training` (with `on delete set null`, since the snapshot keeps the data). Any other cross-module access goes through public APIs.
