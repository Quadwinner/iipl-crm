# Itoby (mobile)

The Itoby superapp for Android and iOS: the company site, the product
catalogue, one sign-in, and every module behind it. Same shape as `apps/web`.

Same Supabase project, same tables, same RPCs as the web portals — and the same
query code. Every read and write goes through `@itoby/shared`, which the web apps
also call. Nothing here reimplements a query.

EAS project: `@shubhamkush/itoby` (`1010c689-84da-4213-ae45-7de6fa288943`).

## Run it

```bash
pnpm install                                   # from the repo root
cp apps/mobile/.env.example apps/mobile/.env   # fill in from the root .env
pnpm --filter @itoby/mobile start
```

Scan the QR with Expo Go **57.0.9 or newer**. The Play Store may serve an older
client; every version's APK is published at
`github.com/expo/expo-go-releases/releases`.

## What is in it

**Signed out** — Home, Services, Products, Contact as tabs; About, service
detail, Industries and Request-a-quote pushed from them. All CMS-driven from
`site_settings`, `service_offerings`, `industries` and `app_modules`, so editing
content in the admin portal changes the app without a release.

**Signed in** — a launcher of tiles from `modules_for_current_user()`.
Administrators also get Leads. Opening a module pushes its own stack.

**IIPL Renting** branches on role before rendering anything:

| Role | Screens |
|---|---|
| `OFFICE_OWNER` | leases, invoices + Razorpay/UPI payment, complaints + raise one, receipts, documents, reminders, profile |
| `ADMINISTRATOR`, `MAINTENANCE_STAFF` | overview, complaint queue + assign/status/comment, buildings → units, tenants, staff, allotments, billing, expenses, audit log, settings |

The other four modules — Lead, Billing, Cashmemo, Calling — are `COMING_SOON` in
`app_modules`, as they are on the web, and render from their own row.

## Layout

| Path | What it holds |
|---|---|
| `src/lib/supabase.ts` | The client. Differs from web only in storage (AsyncStorage), `detectSessionInUrl: false`, and an explicit `processLock`. |
| `src/auth/auth.tsx` | Session state via `authenticate()` from `@itoby/shared/auth`, so lockout counting and the login audit row behave as on web. |
| `src/navigation/` | Public / auth / signed-in stacks. |
| `src/screens/site/` | The company site. |
| `src/modules/rental/` | Owner screens, with `admin/` alongside for staff. |
| `src/modules/admin/` | The superapp's own admin: the leads inbox. |
| `src/features/` | React Query wrappers. One line each — the query lives in `@itoby/shared`. |
| `src/theme/` | Re-exports the palette from `@itoby/shared/theme`. |

## Five things worth knowing

**Import from subpaths, not the barrel.** `@itoby/shared` re-exports the admin
reporting module, which pulls in `pdf-lib` — ~194 modules the app never runs.
Import `@itoby/shared/owner`, `/site`, `/admin`, `/auth`, `/supabase`, `/theme`,
`/types` instead. Check with:

```bash
pnpm --filter @itoby/mobile exec expo export --platform android --dump-sourcemap --output-dir /tmp/x
```

**File watching does not work here.** The repo lives on a FUSE mount that never
fires inotify, and Metro has no polling watcher. **Metro must be restarted after
every edit** — hot reload will not pick changes up, and a stale bundle looks
exactly like a bug in your new code.

**Never run an install while `expo start` is running.** pnpm stages packages in
`node_modules/<pkg>_tmp_<pid>` and deletes them seconds later; Metro's watcher
used to crawl into one, throw an uncaught ENOENT and take the server down. The
`blockList` in `metro.config.js` covers that case, but the watcher stays fragile
on this filesystem.

**Hierarchical lookup must stay on.** pnpm puts a package's own dependencies in
a sibling directory under `.pnpm`, reachable only by walking up. Setting
`disableHierarchicalLookup` — the usual advice for yarn/npm monorepos — breaks
CI while passing locally, because this filesystem makes pnpm fall back to
copying and the local tree comes out flat. `node-linker=hoisted` in the root
`.npmrc` keeps both the same.

**The dev server needs port 8081 open.** `sudo ufw allow 8081/tcp`, or the phone
reports "Failed to download remote update" with no clue that a firewall is why.

## Build

`eas.json` points each profile at an EAS environment rather than inlining
values, so keys live in EAS, not the repo:

```bash
pnpm --filter @itoby/mobile exec eas env:create --environment production \
  --name EXPO_PUBLIC_SUPABASE_URL --value https://<project>.supabase.co

pnpm --filter @itoby/mobile exec eas build --platform android --profile preview
```

`EXPO_PUBLIC_RAZORPAY_KEY_ID` is needed for invoice payment — the publishable key
id only. The secret stays in the `create-payment-intent` Edge Function, and the
gateway webhook remains the only thing that marks an invoice paid.

## Deliberately on the web

Creating buildings, units and allotments, running a billing cycle, the five
`configure_*` settings forms, and the content CMS. All are multi-step forms, or
edit long-form copy, that a wide screen suits better. The app reads them.
