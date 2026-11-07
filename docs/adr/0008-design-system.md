# ADR 0008: Visual language

## Status

Accepted, 2026-11-07.

## Decision

- Reference: iOS 26 Liquid Glass. Simple on screen, smart behind the scenes.
- Colors follow 60/30/10. Light: paper `#FCF8F7` 60, ink `#0B0B0D` 30, red `#FF1744` 10. Dark swaps paper and ink. Small red text uses `#C8102E` in light mode for contrast.
- Frosted glass without borders: strong blur with boosted saturation, a thin light highlight on the top edge, a soft shadow. No grain textures.
- Numbers use **Archivo Expanded** (width 125%), self-hosted. Body text uses the system font (SF Pro on Apple devices).
- Radii: 32 px surfaces, 28 px widgets, 24 px controls inside glass bars (concentric with an 8 px inset).
- Rules for writing UI and motion are in [docs/design/principles.md](../design/principles.md).
