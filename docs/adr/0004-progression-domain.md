# ADR 0004: Progression as a pure, pluggable domain

## Status

Accepted, 2026-11-07.

## Decision

The strength math lives in `progress/domain` as pure functions with unit tests:

- Estimated one-rep max (Epley): load × (1 + reps / 30).
- Volume: load × reps; weekly sets per muscle (primary = 1, secondary = 0.5).
- Stagnation: the last 3 weeks did not beat the best mark from before them.
- Progression strategies, selected per prescribed exercise (`progression_rule`):
    - `double_progression`: all working sets at the top of the rep range with the same load → `increase` (applied automatically, the wheel opens on the new load); a set below the range or mixed loads → `ask`; otherwise `keep`.
    - `none`: always repeat the last load.

New strategies (for coaches in the B2B product) are added to `progressionStrategies` without touching callers.
