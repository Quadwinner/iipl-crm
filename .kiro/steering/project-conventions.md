---
inclusion: always
---

# IIPL CRM — Operational Rules

## Supabase CLI

CLI is not installed globally. Always `npx -y supabase`.

Every command needs the access token sourced from root `.env`:

```bash
set -a; source .env; set +a
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx -y supabase <cmd>
```

**Always pass `--yes` to `db push`.** Without it the CLI blocks forever on an
interactive `[Y/n]` prompt.

```bash
npx -y supabase db push --yes
```

Known-harmless output — do not investigate or "fix" these:
- `Skipping migration .gitkeep... (file name must match pattern)` — placeholder file.
- `failed to cache migrations catalog: ... pgdelta-target-ca.crt ENOENT` — optional
  schema-diff cache only. The migration still applies. Confirm with `migration list`.

## After every migration

1. `pnpm gen:types` (regenerates `packages/shared/src/types/database.types.ts`)
2. `pnpm typecheck`

## Verifying project state

`list_directory` results can be stale. To check what's on disk, use:

```bash
find . -maxdepth 3 -not -path '*/node_modules*' -not -path './.git/*' | sort
```

Do not re-verify the same thing twice. Check once, trust it, move on.

## Secrets

Root `.env` holds real credentials and is gitignored. Never echo its values,
never commit it, never paste keys into chat or code. `.env.example` holds names only.

Before any commit: `git diff --cached | grep -cE 'sbp_[a-z0-9]{40}|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'`
must return 0.

## Code style

- Minimal comments. Only explain non-obvious *why* (e.g. a security guard's purpose).
  No comments restating what the code does.
- SQL: lowercase keywords, snake_case identifiers.
- Do not re-run `supabase init` or overwrite `supabase/config.toml` — project is
  already linked (ref in `.env` as `SUPABASE_PROJECT_REF`).

## Dev servers

`pnpm dev:admin` → :5173, `pnpm dev:owner` → :5174. Run as background processes.
