# ADR 0010: Google sign-in in production

## Status

Accepted, 2026-11-07. Refines ADR 0006: the OAuth handshake (PKCE, `state`, code exchange) uses the
small `arctic` library instead of hand-written requests. Sessions stay in-house.

## Decision

- `GET /api/auth/google` creates `state` and a PKCE verifier and redirects to Google
  (`openid email profile`).
- `GET /api/auth/google/callback` validates `state`, exchanges the code, reads the ID token claims,
  checks the allowlist, finds or creates the user by Google `sub`, creates the personal workspace
  with the starter program on first sign-in, starts a session and redirects to `/`.
- OAuth details live in `identity`; the route handlers only call module public APIs.
- The redirect URI is `${APP_URL}/api/auth/google/callback`.

## Security: Google sign-in

| OWASP                                          | Vector                                                   | How the code closes it                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A01 Broken access control                      | Any Google account signs in                              | Only emails in `ALLOWED_EMAILS` (comma-separated, trimmed, case-insensitive) pass. Others get a neutral error; no user, workspace or session is created. Every repository call still takes a `TenantContext`.                                                                                                                                                                                                          |
| A07 Identification and authentication failures | Login CSRF, code interception, forged identity, fixation | Authorization code flow with PKCE (S256) and a random `state`. `state` and verifier live in 10-minute HttpOnly, Secure, SameSite=Lax cookies, deleted after the callback. A missing or mismatched `state` is rejected. `email_verified` must be `true` and `aud` must be our client id. Users are matched by Google `sub`. Every sign-in creates a new session token; sign-out deletes the session row and the cookie. |
| A02 Cryptographic failures                     | Guessable tokens, stolen database                        | Random values come from `crypto.getRandomValues`. Session cookie: HttpOnly, Secure in production, SameSite=Lax, Path=/. Only the token's SHA-256 is stored.                                                                                                                                                                                                                                                            |
| A05 Security misconfiguration                  | Dev shortcut in production, missing config, weak headers | "Entrar como Leonardo" needs `next dev`, no `VERCEL` and the local database; the server action re-checks it. Environment variables are validated with zod at startup; production fails fast naming the missing variables, never their values. `next.config` sends `nosniff`, `strict-origin-when-cross-origin`, `X-Frame-Options: DENY` and a restrictive `Permissions-Policy`.                                        |
| Open redirect                                  | `?next=https://evil`                                     | No "return to" parameter: sign-in always redirects to `/`.                                                                                                                                                                                                                                                                                                                                                             |
| A09 Logging and monitoring failures            | Silent attacks, or secrets in logs                       | Failed sign-ins are logged with the reason and a truncated SHA-256 of the email. Tokens, codes and full emails are never logged.                                                                                                                                                                                                                                                                                       |
| A03 Injection                                  | SQL injection                                            | Drizzle parameterized queries only. No SQL built from strings.                                                                                                                                                                                                                                                                                                                                                         |

## Consequences

- Google sign-in works only where the redirect URI is registered: the production domain and
  `http://localhost:3005`. Preview deployments cannot sign in with Google.
- The ID token comes straight from Google's token endpoint over TLS, so its signature is not
  re-verified (OpenID Connect Core 3.1.3.7). If tokens ever arrive through the browser, verify them.
