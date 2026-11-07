# ADR 0001: Modular monolith with enforced boundaries

## Status

Accepted, 2026-11-07.

## Context

VITA starts as a single-user app but is expected to grow into B2C and B2B products. Splitting into services now would add cost without benefit; an unstructured app would be hard to grow.

## Decision

One deployable app, split into business modules under `src/modules/`: `identity`, `tenancy`, `catalog`, `training`, `logging`, `progress`. Each module has `domain`, `application`, `infrastructure` and `ui` layers and a public API in `index.ts`.

Rules, enforced by dependency-cruiser on commit and in CI:

- Modules use each other only through `index.ts`.
- `domain` code is pure: no framework, database or other layers.
- `shared/` never imports modules, platform or routes.
- Routes in `src/app` are thin and call the `application` layer.
- Business logic does not depend on Next.js, so a versioned public API (`/api/v1`) can expose it later.

## Consequences

Clear ownership and safe growth. Some boilerplate (public APIs, repositories) is accepted as the price.
