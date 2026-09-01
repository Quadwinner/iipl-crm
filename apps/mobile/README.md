# Itoby (mobile)

Expo app for office owners. Same Supabase project, same tables, same RPCs as the
web portals — and the same query code: every read comes from `@itoby/shared/owner`,
which the web owner portal also calls. Nothing here reimplements a query.

EAS project: `@shubhamkush/itoby` (`1010c689-84da-4213-ae45-7de6fa288943`).

## Run it

```bash
pnpm install                 # from the repo root
cp apps/mobile/.env.example apps/mobile/.env   # fill in from the root .env
pnpm --filter @itoby/mobile start
```

Then scan the QR with Expo Go, or press `a` / `i`.

`.env` holds only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
— the same two public values the web apps read as `VITE_SUPABASE_*`. Anything
secret stays server-side, in Edge Functions.

## Build

`eas.json` points each build profile at an EAS environment rather than inlining
values, so the keys live in EAS, not in the repo:

```bash
pnpm --filter @itoby/mobile exec eas env:create --environment production \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://<project>.supabase.co
pnpm --filter @itoby/mobile exec eas env:create --environment production \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon key>

pnpm --filter @itoby/mobile exec eas build --platform android --profile preview
```

## Layout

| Path | What it holds |
|---|---|
| `src/lib/supabase.ts` | The client. Differs from web only in storage (AsyncStorage) and `detectSessionInUrl: false`. |
| `src/auth/auth.tsx` | Session state. Sign-in calls `authenticate()` from `@itoby/shared/auth`, so lockout counting and the login audit row behave exactly as on web. |
| `src/features/queries.ts` | React Query wrappers. One line each — the query itself lives in `@itoby/shared/owner`. |
| `src/screens/` | One screen per tab, plus sign-in and the non-owner notice. |
| `src/theme/` | Design tokens. |

## Two things worth knowing

**Import from subpaths, not the barrel.** `@itoby/shared` re-exports the admin
reporting module, which pulls in `pdf-lib` — 136 modules and ~1.3 MB of bundle
the app never runs. Importing `@itoby/shared/owner`, `/auth`, `/supabase`,
`/types` keeps it out. Check with:

```bash
pnpm --filter @itoby/mobile exec expo export --platform android --dump-sourcemap --output-dir /tmp/x
```

**Metro needs the workspace config.** `metro.config.js` watches the repo root and
enables symlink resolution; pnpm links packages rather than copying them, so
without it `@itoby/shared` does not resolve and React can end up duplicated.
