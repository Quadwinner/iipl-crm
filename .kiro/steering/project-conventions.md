---
inclusion: always
---

# IIPL CRM — Operational Rules

## Supabase CLI

CLI is a root devDependency (`supabase@2.109.1`), not global. Always `pnpm exec supabase`.

Do **not** use `npx -y supabase` — pnpm 10 blocks lifecycle scripts, so npx cannot
place the CLI binary and fails with a misleading `sh: 1: supabase: not found`.

Every command needs the access token sourced from root `.env`:

```bash
set -a; source .env; set +a
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" pnpm exec supabase <cmd>
```

**Always pass `--yes` to `db push`.** Without it the CLI blocks forever on an
interactive `[Y/n]` prompt.

```bash
pnpm exec supabase db push --yes
```

If the binary ever goes missing again, `pnpm install` is enough — the version is
pinned and `pnpm.onlyBuiltDependencies` in root `package.json` keeps `supabase`
allowed to run its install step. Keep the CLI version at or above whatever wrote
`supabase/config.toml`, or the CLI rejects the config with `invalid keys` errors.

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

## Repository hygiene

Do not create summary, implementation-notes, integration, usage, or per-function
README files. No `TASK_N_IMPLEMENTATION.md`, no `*_USAGE.md`, no `INTEGRATION.md`.
Task outcomes belong in the chat response and the commit message, not in new files.

Only these docs exist and only these should be edited: root `README.md`, `AGENTS.md`,
`.kiro/steering/*`, and the three spec files under `.kiro/specs/office-rental-crm/`.

Every new file must be something the application needs at build or run time —
a migration, an Edge Function, source, config, or a test. Delete scratch and
verification files before finishing a task.

## Code style

- Minimal comments. Only explain non-obvious *why* (e.g. a security guard's purpose).
  No comments restating what the code does.
- SQL: lowercase keywords, snake_case identifiers.
- Do not re-run `supabase init` or overwrite `supabase/config.toml` — project is
  already linked (ref in `.env` as `SUPABASE_PROJECT_REF`).

## Dev servers

`pnpm dev:admin` → :5173, `pnpm dev:owner` → :5174. Run as background processes.
