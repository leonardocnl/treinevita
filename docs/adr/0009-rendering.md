# ADR 0009: Per-request rendering (Cache Components off)

## Status

Accepted, 2026-11-07.

## Context

Next.js 16 offers Cache Components, which prerenders a static shell and requires every request-time read (cookies, session) to sit behind a `<Suspense>` boundary.

## Decision

Cache Components is turned off for now. Every VITA screen depends on who is signed in and on data that changes with each set logged, so there is nothing meaningful to prerender. Pages render per request and server actions call `revalidatePath` after mutations.

## Revisit when

There are public, cacheable pages (marketing site, public profiles) or measurable latency on the Summary screen.
