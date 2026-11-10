# Deploy

VITA runs on Vercel at `https://treinevita.vercel.app`, with Neon as the database.

## Vercel

- Framework preset: Next.js. `vercel.json` sets the build command:
  `npm run db:migrate:deploy && npm run db:seed:catalog && npm run build`.
- Install the **Neon integration**. It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`, and gives
  every preview deployment its own Neon branch, so migrating during the build is safe.

## Region

- Functions run in **`gru1` (São Paulo)**, set in `vercel.json` (`"regions": ["gru1"]`). The Neon
  database is in **AWS `sa-east-1` (São Paulo)** and the people using the app are in Brazil, so the
  server sits next to both.
- Why it matters: Vercel's default is `iad1` (Washington). From there every query to São Paulo costs
  about 100–150 ms of round trip, and a page that runs a few queries one after another loses most of a
  second to distance alone. From `gru1` a query round trip to Neon is a few milliseconds.
- If the database ever moves, move the functions with it: pick the Vercel region closest to the Neon
  region.

## Performance notes

- **Driver:** one-shot queries use Neon's HTTP driver (`drizzle-orm/neon-http`): one round trip, no
  connection to open. Transactions (first sign-in, saving the profile or the dashboard layout) use one
  WebSocket pool, opened on first use and shared by the function instance. Local development keeps
  PGlite. See `src/platform/db/drivers.ts`.
- **Timing logs:** the workout pages and the set actions log one line per request with the route, the
  number of queries, the summed database time and the total time, e.g.
  `[timing] /treino queries=7 db=12ms total=18ms`. No user data. See them in the Vercel function logs.
  App Router pages stream and server actions have no response headers to set, so there is no
  `Server-Timing` header; the log line is the measurement.
- **Neon cold start:** the free plan suspends the database after a few idle minutes, and the first
  query after a pause waits for it to wake up (often half a second or more). To hide most of it, the
  app shell fires one non-blocking `GET /api/wake` when it loads (`src/app/_components/wake-database.tsx`).
  The route runs `SELECT 1` and returns 204: no body, no user data, no session needed. It is
  rate-limited per IP in memory (6 per minute per function instance, best effort; past it, 429), so it
  can at most keep the database awake. There are still no cron pings. See ADR 0013.

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

## Installing on the iPhone (PWA)

- The manifest comes from `src/app/manifest.ts` (name and short name "VITA", `display: standalone`,
  start URL `/`, colors from the dark `bg` token, which matches the icon).
- Icons are generated from `brand/icon/icon.png` (1024 × 1024) by `npx tsx scripts/generate-icons.ts`
  with `sharp` into `public/icons/` (apple-touch-icon 180, 192, 512, a maskable 512 with safe-area
  padding, favicons 16 and 32) and `src/app/favicon.ico`. The outputs are committed; run the script
  again when the icon changes.
- iOS: `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style: black-translucent`,
  so the app draws under the status bar; every screen starts at `max(env(safe-area-inset-top), 24px)`
  and the bottom bars sit above `env(safe-area-inset-bottom)`.
- Install: open the site in Safari, Share → "Adicionar à Tela de Início", then open VITA from the icon.
