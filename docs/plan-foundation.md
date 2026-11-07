# Foundation plan

## Goal

A workout tracker that is better than generic gym apps: fast logging, real progress tracking and a calm, Apple-like interface. Single user today; B2C and B2B (gyms, personal trainers, public API) later without rewriting the database.

## Phases

| Phase | Scope                                                                                                                            | Status  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| 0     | Foundation: tooling, modules, database schema, progression domain, quality gates, docs                                           | Done    |
| 1     | Sign in with Google (allowlist), personal workspace on first sign-in, sessions                                                   | Next    |
| 2     | Design system in code, Summary with widgets, programs A/B/C (seed of the current plan), workout session with the selection wheel | Planned |
| 3     | Progress: charts per exercise, weekly volume per muscle, records, calendar, stagnation, body measurements                        | Planned |
| 4     | Desktop layout refinements, dark theme, PWA polish                                                                               | Planned |

## MVP scope

- Programs A/B/C with prescribed exercises (sets, rep range, progression rule).
- Workout session: list of exercises plus a focus screen per exercise; sets logged with a selection wheel that opens on the right load.
- Automatic double progression: when the progression is obvious the wheel already opens on the new load with a discreet mark; when it is ambiguous the app asks.
- Summary screen made of customizable widgets.
- Progress charts, records, weekly volume per muscle, training calendar, stagnation warning.
- Weight and waist (body fat and other measurements optional).
- Weekly frequency goal, no streaks.

## Out of the MVP

Offline mode, rest timer, push notifications, progress photos, public sign-up, billing, B2B features, AI import of a program from a screenshot.

## Product decisions

Recorded from the product interview of 2026-11-07:

- Exercise demonstrations: photos from an open, public domain dataset, plus a YouTube link per exercise when the machine does not match.
- Programs are built inside the app; the old program is archived with its full history.
- Body measurements: weight and waist by default, body fat optional, the other measurements behind "more measurements".
