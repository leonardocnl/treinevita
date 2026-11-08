# VITA

Workout tracking web app: sessions, load progression, body measurements and progress charts. Mobile-first, also works on desktop, installable on the iPhone home screen.

Today it is a single-user app. The foundation is built for individual users (B2C) and gyms or personal trainers (B2B, including a future public API).

## Stack

- Next.js (App Router), React, TypeScript (strict), Tailwind CSS
- Postgres on Neon, accessed through Drizzle ORM
- Deployed on Vercel (`develop` = preview, `main` = production)

## Getting started

```bash
nvm use            # Node 22
npm install        # also installs the git hooks
cp .env.example .env.local   # fill in the values
npm run db:migrate # apply migrations to your Neon database
npm run dev
```

## Local development without Neon

Without `DATABASE_URL` the app uses a local Postgres (PGlite) stored in `.data/`.

```bash
npm run db:local:reset   # recreate the local database with six weeks of mock training
npm run dev -- -p 3005   # open http://localhost:3005 and use "Entrar como Leonardo"
```

The seeded owner has no profile yet, so the first visit goes through the onboarding (`/comecar`), where "Manter minha ficha atual" keeps the seeded A/B/C program.

The "Entrar como Leonardo" shortcut exists only in development with the local database; it is never available in production.

PGlite allows one process at a time: close Drizzle Studio (`npm run db:studio`) before `npm run dev`, and stop the dev server before `npm run db:local:reset`.

## Scripts

| Script                            | What it does                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `npm run dev`                     | Development server                                                               |
| `npm run build`                   | Production build                                                                 |
| `npm run test`                    | Unit tests (Vitest)                                                              |
| `npm run lint`                    | ESLint                                                                           |
| `npm run check:types`             | TypeScript check                                                                 |
| `npm run check:architecture`      | Module boundary rules (dependency-cruiser)                                       |
| `npm run check:format`            | Prettier check (4-space indentation)                                             |
| `npm run db:generate`             | Create a migration from the table files                                          |
| `npm run db:migrate`              | Apply migrations                                                                 |
| `npm run catalog:import-drawings` | Re-import the Everkinetic exercise drawings (pinned commit, cached in `.cache/`) |

## Architecture

Modular monolith. Each business subject is a module under `src/modules/` with its own layers and tables. See [docs/plan-foundation.md](docs/plan-foundation.md) and the ADRs in [docs/adr](docs/adr).

```
src/
    app/          thin routes (Next.js)
    modules/      identity, tenancy, catalog, training, logging, progress
    platform/     composition root (database client, schema aggregation)
    shared/       generic building blocks (db columns, tenant filter, ui)
```

## Quality gates

- On commit: format, lint and architecture checks.
- On push: type check and tests.
- In CI: all of the above plus the production build.
