# ADR 0013: Design v2 — habits, goals and the wake route

## Status

Accepted, 2026-11-10.

## Context

Design v2 adds goals with a deadline, manual trackers (sleep, water, steps, energy and up to 10 custom ones) with one entry per day, custom widgets on the home, and a public `GET /api/wake` route that wakes the suspended Neon database. AGENTS.md asks for the attack vectors before building.

## Decision

- Goals live in `progress` (`goals`): they read training and body data the module already owns.
- Manual trackers live in a new `habits` module (`habit_trackers`, `habit_entries`): they are not training, and keeping them apart keeps health-related data in one place. ADR 0001 lists the module.
- Every new table has `workspace_id`, `deleted_at` (soft delete) and a migration (`drizzle/0004_design_v2_habits_goals.sql`).

## OWASP Top 10

| Vector                                         | How it is closed                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A01 Broken access control                      | Every repository function takes a `TenantContext` and filters with `inTenant` plus the user id. Ids sent by the client are checked again on the server: a custom tracker id must be one of the person's trackers (`ownCustomTrackerIds`), a goal's exercise must be visible to the workspace, a goal id is deleted only inside the person's rows, and a layout with any foreign tracker id is rejected as a whole. The day of an entry comes from the server, never from the client. |
| A03 Injection                                  | Drizzle builds parameterized queries; no SQL is concatenated.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| A04 Insecure design                            | zod on every server action, with strict ranges per tracker type: hours 0–24 (0.5 steps), liters 0–10 (0.25), steps 0–100 000 (500), cardio 0–600 minutes, energy 1–5, yes/no 0–1, custom names 1–30 characters, units up to 8, at most 10 custom trackers, at most 10 goals (target 1–500 kg, deadline in the future), at most 24 widgets with allowed kinds and sizes only. Values off the range or the step are rejected in the domain (`isValidValue`), not only in the action.   |
| A05 Security misconfiguration                  | `/api/wake` returns 204 with no body, holds no data and needs no session; it only runs `SELECT 1`.                                                                                                                                                                                                                                                                                                                                                                                   |
| A07 Identification and authentication failures | Every action resolves the session itself (`requireAppContext`).                                                                                                                                                                                                                                                                                                                                                                                                                      |
| A09 Logging failures and data exposure         | Sleep, energy, weight and measurements are never logged; the query timer logs counts and durations only.                                                                                                                                                                                                                                                                                                                                                                             |
| Denial of service on the public route          | `/api/wake` is rate-limited per IP in memory (best effort, per function instance): it can at most keep the database awake.                                                                                                                                                                                                                                                                                                                                                           |

## LGPD

Sleep, energy, weight and body measurements are health-related data (sensitive personal data). Only what the widgets show is stored: one value per tracker and day, plus cardio minutes for steps. Nothing is shared or logged. **Before the app opens to other people, export and deletion of this data are required** (ADR 0007).

## Consequences

The home loads everything in one batch of parallel queries and computes the widgets in pure domain functions, so the new widgets do not add round trips per widget.
