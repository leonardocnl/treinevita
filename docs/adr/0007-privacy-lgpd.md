# ADR 0007: Privacy (LGPD)

## Status

Accepted, 2026-11-07.

## Decision

- Weight and body measurements may be health data, which the LGPD treats as sensitive. They live in their own table (`body_measurements`) and only the owner reads them.
- A coach reads someone's body data only with an active row in `data_consents` (modelled now, used in the B2B phase).
- Export and deletion of a person's data are application use cases (screens can come later).
- No personal data in logs or in the browser console.
- Fonts are self-hosted, so pages make no third-party request to Google Fonts.
- Progress photos are out of the MVP.
