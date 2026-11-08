# Deploy

VITA runs on Vercel at `https://treinevita.vercel.app`, with Neon as the database.

## Vercel

- Framework preset: Next.js. `vercel.json` sets the build command:
  `npm run db:migrate:deploy && npm run db:seed:catalog && npm run build`.
- Install the **Neon integration**. It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, and gives
  every preview deployment its own Neon branch, so migrating during the build is safe.

## Environment variables

| Variable                | Where                     | Purpose                                                |
| ----------------------- | ------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`          | Neon integration          | Pooled connection used by the app.                     |
| `DATABASE_URL_UNPOOLED` | Neon integration          | Direct connection, preferred by migrations.            |
| `GOOGLE_CLIENT_ID`      | Production, Preview       | Google OAuth client.                                   |
| `GOOGLE_CLIENT_SECRET`  | Production, Preview       | Google OAuth client secret.                            |
| `ALLOWED_EMAILS`        | Production, Preview       | Comma-separated emails allowed to sign in.             |
| `APP_URL`               | Production (and each env) | Public base URL, e.g. `https://treinevita.vercel.app`. |

In production every variable is validated with zod when the server starts (`src/instrumentation.ts`);
a missing one stops the server with a message naming it, never its value. See `.env.example`.

## Google Cloud

In the OAuth client (type "Web application"), register:

- Authorized JavaScript origins: `https://treinevita.vercel.app`, `http://localhost:3005`.
- Authorized redirect URIs: `https://treinevita.vercel.app/api/auth/google/callback`,
  `http://localhost:3005/api/auth/google/callback`.

Google sign-in therefore works only on the production domain and on `http://localhost:3005`.
Preview URLs change per deployment and are not registered, so Google refuses them.

## Database

- **Migrations** (`npm run db:migrate:deploy`, `scripts/migrate.ts`) apply `drizzle/` with the Neon
  driver, using `DATABASE_URL_UNPOOLED` when present. The script refuses to run without a URL.
- **Catalog** (`npm run db:seed:catalog`) upserts the global exercise catalog by slug. No users, no
  history; safe on every build.
- **First sign-in** creates the user, the personal workspace and the starter A/B/C program in one
  transaction. It never runs twice for the same person.
- **Local** development keeps PGlite with mock data (`npm run db:local:reset`). That script refuses to
  run with `DATABASE_URL`, on Vercel or with `NODE_ENV=production`.
