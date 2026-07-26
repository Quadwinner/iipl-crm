---
inclusion: fileMatch
fileMatchPattern: 'apps/**/*.{ts,tsx}'
---

# Portal Frontend Rules

## Stack

React 19 + TypeScript, Vite. React Router (routing), TanStack Query (server state),
React Hook Form + Zod (forms), Tailwind + shadcn/ui (UI), TanStack Table (grids).

Two apps: `apps/admin-portal` (Company_Staff) and `apps/owner-portal` (Office_Owner).
Anything used by both belongs in `packages/shared`, not copy-pasted.

## Supabase access

Use the per-app `src/lib/supabase.ts` wrapper — `supabase()` — never call `createClient`
directly. The anon key is the only key the browser gets; every request runs under RLS.

Multi-step writes call an RPC (`supabase().rpc('create_allotment', {...})`), never a
sequence of client-side inserts. If an operation needs to be atomic, it's a Postgres
function; if one doesn't exist yet, that's a backend task, not something to work around
in the client.

## Server state

TanStack Query for all reads. Key queries by their filter inputs so cache invalidation is
predictable. After a mutation, invalidate the affected query keys rather than refetching
everything.

Never trust the client for authorization. Hiding a button is UX; the RLS policy and RPC
permission check are the actual enforcement. Do both.

## Forms

Zod schemas mirror the bounds in requirements.md exactly — unit code 1-50 chars,
floor -5..200, size (0, 1_000_000], rent [0.01, 9_999_999.99], description 1-2000,
phone 10-15 digits, password ≥8. Put shared schemas in `packages/shared` so both portals
and any Edge Function validate identically.

Surface server errors inline on the offending field. The database raises specific errcodes
(`42501` denied, `22023` invalid, `23505` conflict) — map them to useful messages rather
than showing a generic failure.

## Auth

`authenticate()` from `@itoby/shared/auth`. It returns one generic message for every
credential failure by design (Requirement 5.2) — do not add UI that distinguishes
"unknown email" from "wrong password".

Route guards check role from `profiles`. Owner_Portal is `OFFICE_OWNER` only; Admin_Portal
distinguishes `ADMINISTRATOR` from `MAINTENANCE_STAFF`.

## Accessibility

Label every input. Keyboard-navigable dialogs and menus. Errors announced, not just
colored. shadcn/ui primitives handle most of this — don't replace them with bare divs.

## Style

Minimal comments; explain non-obvious *why* only. Functional components with hooks.
Import shared code via `@itoby/shared`, local code via the `@/*` alias.
