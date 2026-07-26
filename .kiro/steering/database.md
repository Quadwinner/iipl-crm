---
inclusion: fileMatch
fileMatchPattern: 'supabase/migrations/**/*.sql'
---

# Migration & SQL Rules

## Workflow

1. Check what already exists before writing — `supabase/migrations/` is the history.
   Duplicate object names fail with `already exists` and abort the push.
2. Filename: `<UTC timestamp>_snake_case_name.sql`. Never edit an applied migration;
   add a new one.
3. Apply: `npx -y supabase db push --yes`
4. Then always: `pnpm gen:types` → `pnpm typecheck`

## Style

Lowercase keywords, snake_case identifiers, singular table names (`invoice`, not `invoices`)
except where already established (`profiles`, `notifications`, `audit_log_entries`).

Types: `uuid` PKs defaulting `gen_random_uuid()`, `timestamptz` for all timestamps,
`numeric(12,2)` for money (never float), `date` for calendar dates, Postgres `enum` for
closed value sets, `check` constraints for bounded ranges.

## Functions

Every function sets `search_path = ''` and schema-qualifies all references. Without this,
a `SECURITY DEFINER` function is vulnerable to search_path hijacking.

`SECURITY DEFINER` only when the function must act beyond the caller's RLS visibility
(system jobs, pre-auth lockout bookkeeping, cross-table reads used inside policies).
Otherwise `SECURITY INVOKER` so RLS still applies.

Do not name a function after a reserved SQL keyword. `current_role` is reserved —
existing `public.current_role()` only works schema-qualified.

## RLS

Enable on every table. Owner isolation resolves the owner server-side:

```sql
office_owner_id = (select id from public.office_owners where user_id = auth.uid())
```

Never trust a client-supplied owner id. Role checks go through `public.is_administrator()`
or `public.authorize('PERMISSION_KEY')`, not inline role subqueries in new policies.

Policies that query the same table they protect cause infinite recursion — use a
`SECURITY DEFINER` helper instead (this is why `is_administrator()` exists).

## Atomicity

Multi-step writes belong in one `plpgsql` function so they share a transaction. Lock
contended rows with `select ... for update` before checking state, or two concurrent calls
will both pass the check. Raise with an errcode (`42501` denied, `22023` invalid input,
`23505` conflict) so callers can map to HTTP status.

## Audit

Any create/modify/terminate on allotment, invoice, payment, or owner account inserts an
`audit_log_entries` row *inside the same function*, via `public.record_audit(...)`.
Never grant UPDATE or DELETE on that table.

## Existing helpers — reuse, don't recreate

`is_administrator()`, `current_role()`, `authorize(key)`, `require_permission(key)`,
`session_expired()`, `touch_session()`, `enqueue_notification(...)`, `record_audit(...)`,
`config()`. Tunables live in the single-row `global_config`.
