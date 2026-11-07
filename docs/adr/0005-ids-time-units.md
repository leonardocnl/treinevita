# ADR 0005: Identifiers, time and units

## Status

Accepted, 2026-11-07.

## Decision

- Primary keys are **UUID v7**: time-ordered (index friendly) and not enumerable.
- Every timestamp is `timestamptz` (stored in UTC). The training "day" is computed with the user's time zone (`America/Sao_Paulo` by default).
- Loads are stored in **kilograms** (`numeric`); the display unit is a user preference.
- Domain tables carry `created_at`, `updated_at` and `deleted_at` (soft delete).
- Nothing sensitive goes in URLs; ownership is checked on every read and write.
