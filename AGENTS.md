# AGENTS.md

Office rental CRM for IIPL. Two portals over one Supabase (Postgres) backend.

## Structure

```
apps/web/              Vite + React + TS — Itoby superapp: public site, launcher,
                       and the rental CRM behind one sign-in (:5175)
apps/admin-portal/     Vite + React + TS — Company_Staff UI (:5173)
apps/owner-portal/     Vite + React + TS — Office_Owner UI (:5174)
packages/shared/       @itoby/shared — Supabase client, generated DB types, domain types, auth
supabase/migrations/   Postgres migrations (source of truth for schema)
supabase/functions/    Edge Functions (Deno) — webhooks, notifications, uploads
scripts/               One-off operational scripts
.kiro/specs/office-rental-crm/   requirements.md, design.md, tasks.md
```

## Commands

| Task                | Command                              |
| ------------------- | ------------------------------------ |
| Install             | `pnpm install`                       |
| Dev (admin)         | `pnpm dev:admin` → :5173             |
| Dev (owner)         | `pnpm dev:owner` → :5174             |
| Dev (superapp)      | `pnpm dev:web` → :5175               |
| Sync rental module  | `pnpm sync:rental`                   |
| Typecheck all       | `pnpm typecheck`                     |
| Build all           | `pnpm build`                         |
| Lint                | `pnpm lint`                          |
| Regenerate DB types | `pnpm gen:types`                     |
| Create admin user   | `pnpm seed:admin <email> <password> [name]` |
| Apply migrations    | `npx -y supabase db push --yes`      |

Supabase CLI is not global — always `npx -y supabase`, with the token sourced from `.env`.

## Architecture rules

**Multi-step writes go in Postgres functions, not the client.** Anything that must be
atomic (allotment + occupancy, payment + invoice + receipt, any write + its audit row)
is one `plpgsql` function invoked via `supabase.rpc()`. This is how the spec's atomicity
requirements are met — a client-side sequence of calls cannot satisfy them.

**Authorization is enforced twice, deliberately.** RLS policies at the database layer plus
`require_permission()` inside RPCs. Never rely on only one. Owner-scoped queries are always
parametrized by the caller's own `office_owner_id`, resolved server-side from `auth.uid()` —
never from a client-supplied id.

**The rental module inside the superapp is generated, not authored.**
`apps/admin-portal` and `apps/owner-portal` stay the editable source of truth and
the deployment rollback path. `apps/web/src/modules/rental/{admin,owner}` are
derived copies: change a portal, then run `pnpm sync:rental` and commit both.
Never hand-edit the copies — the next sync overwrites them. `pnpm sync:rental:check`
exits non-zero on drift and is the check to run before pushing. Editing a portal
without syncing does not error; the superapp just keeps serving the old screens.

**Mounting the rental trees branches on role BEFORE either AuthProvider renders.**
The owner provider signs out any session that is not an active `OFFICE_OWNER`, so
mounting the owner tree for an administrator ends their session rather than merely
rendering the wrong screen. See `apps/web/src/modules/rental/index.tsx`.

**The audit log is append-only.** `audit_log_entries` has no UPDATE/DELETE grants. If an
audit write fails, the enclosing transaction must roll back (Requirement 14.4).

**Service-role key never reaches the browser.** It belongs in Edge Functions and scripts only.
Frontend uses the anon key and lives under RLS.

## Where things live

- Enums/domain shapes → `packages/shared/src/types/domain.ts`
- Generated schema types → `packages/shared/src/types/database.types.ts` (do not hand-edit)
- Auth flow → `packages/shared/src/auth/authenticate.ts`
- Supabase client factory → `packages/shared/src/supabase/client.ts`

## Spec

Work follows `.kiro/specs/office-rental-crm/tasks.md`. Each task cites the requirement
clauses it satisfies. `design.md` defines 36 correctness properties; tasks marked `*` are
the property tests for them. Read the requirement clauses before implementing a task.

## Environment

Root `.env` holds real credentials and is gitignored. `.env.example` lists names only.
Both portals read the root `.env` via Vite `envDir`. Never commit or echo secret values.
