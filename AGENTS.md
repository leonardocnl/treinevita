<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (VITA)

- Commits and pull requests are authored only by Leonardo Carvalho Silva. Never add `Co-Authored-By`, "Generated with Claude Code" or any AI attribution.
- Conventional Commits in English. Branches: `main` (production), `develop` (integration), `feat/*` and `fix/*` with PRs into `develop`.
- 4-space indentation everywhere.
- English for code, database, docs and commits; Brazilian Portuguese for user-facing text.
- Respect the module boundaries in `docs/adr/0001-modular-monolith.md`; run `npm run check:architecture`.
- Every repository function takes a `TenantContext` (`docs/adr/0002-multi-tenancy.md`).
- Before building a feature, list the attack vectors it brings (OWASP Top 10) and how the implementation closes them.
- Follow `docs/design/principles.md` for UI and motion.
