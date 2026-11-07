# ADR 0002: Multi-tenancy from day one

## Status

Accepted, 2026-11-07.

## Decision

- The tenant is a **workspace**. Every user gets a personal workspace on first sign-in; a gym or a trainer will be an organization workspace.
- Memberships link users to workspaces with a role: `owner`, `coach` or `member`.
- One Postgres schema with a `workspace_id` column on every domain table (not one schema per tenant).
- Repositories receive a mandatory `TenantContext` (`workspaceId`, `userId`) and filter with `inTenant()`. Tests must prove one workspace cannot read or change another's rows.
- **Row-Level Security** (Postgres RLS) is the second line of defense. The schema is ready for it (every table has `workspace_id`, the database client uses a driver with interactive transactions so the tenant can be set per transaction). RLS must be turned on before the first external tenant.

## Why Postgres and not SQLite

SQLite (including hosted options such as Turso) has no row-level security. For a product that will hold several gyms' data in one database, a database-level guarantee matters more than the small gain in lightness.
