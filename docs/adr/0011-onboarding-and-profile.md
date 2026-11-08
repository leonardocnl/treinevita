# ADR 0011: Onboarding, profile and exercise drawings

## Status

Accepted, 2026-11-08.

## Context

VITA now asks a few questions after the first sign-in (`/comecar`), stores a profile (`user_profile`, identity module), lets the person keep their program or start from a code-defined template, and shows exercise drawings from Everkinetic (CC BY-SA 4.0). AGENTS.md asks for the attack vectors before building; this ADR lists them with what closes each one.

## Decision

### A01 Broken access control

- Every action resolves the session on the server (`requireAppContext`, or `requireOnboardingContext` for `/comecar`) and writes only the signed-in person's rows. The profile is keyed by the session's `user_id`; programs, preferences and weigh-ins go through `TenantContext` and `inTenant()`.
- No id travels from the client. The onboarding sends answers and catalog slugs only; the server looks the slugs up in the global catalog and rebuilds the prescriptions from the template, so sets and rep ranges never come from the browser.
- "Manter minha ficha atual" is accepted only when the workspace has an active program.
- Every app route redirects to `/comecar` until the onboarding is done (`onboardingRedirect`, unit tested), and `/comecar` redirects home once it is.

### A03 Injection and A04 Insecure design

- Every server action validates its whole input with zod (`profileSchema`, `programChoiceSchema`, the theme enum). Ranges: weight 30–300 kg in half kilos, height 100–250 cm, name 1–40 characters after trimming, weekly goal 1–7, enums for every choice, at most 7 days and 12 exercises per day, slugs `^[a-z0-9_]{1,60}$`.
- The database repeats the health ranges as `CHECK` constraints on `user_profile`.
- The onboarding is saved in one transaction (profile, weekly goal, first weigh-in, program). An invalid program choice throws inside the transaction, so nothing is half saved.
- The theme cookie is parsed against an allowlist (`parseTheme`, unit tested); anything else means "system". It is `httpOnly`, `sameSite=lax` and `secure` in production.

### A08 Software and data integrity

- The Everkinetic dataset is read at a pinned commit by `scripts/import-everkinetic.ts`, run by hand. The output is committed; builds never download anything.
- Every SVG is sanitized at import time with an allowlist (`sanitizeSvg`, unit tested): only `svg`, `g`, `path`, `circle`, `ellipse`, `line`, `polyline`, `polygon` and `rect`, and only presentation attributes. Scripts, `on*` handlers, `foreignObject`, `style`, links, external references and values with `url(` are removed; the markup is rebuilt, not copied.
- The drawings are served as files from `public/exercises/<slug>/` and used as CSS masks. Their paths come from the catalog seed and are checked against `^/exercises/[a-z0-9_]+/(start|end)\.svg$` before reaching a `url()`. No user input ever becomes markup.
- `media_source` (`everkinetic`, `none`, `own`) records the origin, so own drawings can replace them one exercise at a time.

### Privacy (LGPD)

- Weight and height are health data. The profile stores only what the app uses: name, goal, experience, weight, height, and the optional session length and training place.
- They are never logged: the actions do not log their input, and errors shown to the person are generic sentences.
- The starting weight also becomes the first row in `body_measurements`, the table ADR 0007 already set aside for body data.
- **Before the app opens to other people**, account deletion and data export must exist (as use cases first, screens later), as ADR 0007 already requires.

### Other decisions

- New workspaces no longer get the A/B/C starter program at sign-in; the onboarding creates the program. The owner's existing program stays and is offered as "Manter minha ficha atual".
- The pure template code is also exported from `src/modules/training/client.ts`, a browser-safe entry point, because `index.ts` pulls in server-only code.
- The desktop notice is a CSS breakpoint (`lg`, 1024px) in the app layouts, not user-agent sniffing; `/entrar` and `/creditos` are not gated.

## Consequences

The onboarding cannot be bypassed and cannot write another workspace's data. The drawings carry no active content. Templates and the catalog must agree; a test in `src/platform/db/seed-consistency.test.ts` checks it.
