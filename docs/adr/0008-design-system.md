# ADR 0008: Visual language

## Status

Accepted, 2026-11-07. Revised the same day: direction "Ponto e linha". Superseded on 2026-11-09 by design v2.

## Decision

- Design v2: bold, sharp, editorial. Black and white with a single red accent (`#FF1744`) that only marks live states, achievements and the primary action's cell.
- Text uses **Mona Sans** (variable, `wdth` and `wght`), self-hosted from the official repository under the SIL Open Font License. Numbers of 36 px and up use **Doto**. Inter is removed.
- No borders, dividers or shadows: separation comes from space, scale and tone. Only tappable things have a fill; the glass navbar and sheets are the only surfaces.
- The full system is in [docs/design/DESIGN.md](../design/DESIGN.md), locked on 2026-11-09.

## Consequences

Every screen is rebuilt on the v2 components in `src/shared/ui/`. "Ponto e linha" components (pills, panels, hairline lists, tiles) are deleted.
