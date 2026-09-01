# design-sync notes

Findings that should survive between syncs.

- **The repo had no design-system package until 2026-09-01.** The shadcn
  primitives lived as per-app copies in `apps/{admin-portal,owner-portal,web}`
  plus two generated rental copies. `packages/ui` (`@itoby/ui`) was extracted
  from `apps/web`'s set — the superset, and the only one carrying the
  scroll-lock fix from b8337a1. Sync targets `packages/ui`, never an app.

- **Two palettes live in this repo, and only one belongs to the library.**
  `@itoby/ui/styles.css` carries the IIPL CRM tokens (warm off-white ground,
  navy `--primary`, Geist). The dark/lime Itoby marketing theme is scoped to
  `.itoby-site` in `apps/web/src/site/site.css` and is **not** part of the
  library — its components (`apps/web/src/site/ui`, 28 files) are a ported
  third-party kit with their own idiom and are deliberately out of scope.

- **Tailwind 4 does not scan `node_modules`.** Each consuming app declares
  `@source '../../../packages/ui/dist'` and `.../src` in its `index.css`.
  Without those, every class baked into a library component is dropped from
  the generated CSS and components render unstyled. Any preview harness for
  this package needs the same declaration.

- **The library build externalises React and all runtime deps** (see
  `packages/ui/vite.config.ts`). `dist/index.js` is ESM only; declarations come
  from a separate `tsc -p tsconfig.build.json` pass.

- **`packages/ui` must build before the apps** — the root `build` script
  orders it first.

## Re-sync risks

- **No authored previews.** `.design-sync/previews/` was removed at the user's
  request on 2026-09-01, so all 76 components ship the typographic floor card.
  They are fully importable, typed and documented — only the rendered example
  cards are absent. Authoring any `<Name>.tsx` under `.design-sync/previews/`
  on a later sync brings that component into grading; nothing else changes.

- **Overlay components need care if previews are ever authored.** Radix
  `Dialog` accepts `modal={false}`, which lets its content render inside the
  captured card once `position`/`inset`/`translate` are reset (Tailwind v4 emits
  the CSS `translate` property, so `transform: none` alone does NOT cancel
  `translate-x-[-50%]`). `AlertDialog` takes no `modal` prop — it is always
  modal — so its portal never lands in the card; compose its parts directly
  inside the Root instead of using `AlertDialogContent`.

- **`Avatar` renders blank by design** with no image and no fallback; the
  render check flags `[RENDER_BLANK]` for it. Not a defect.

- **The library's CSS is now a build artifact.** `packages/ui/dist/styles.css`
  is produced by `build:css` (Tailwind CLI over `src/styles.css`, which carries
  `@source` lines for the package's own components). Pointing `cssEntry` at the
  *source* sheet instead ships bare `@import 'tailwindcss'` lines and every
  design renders unstyled — that was the first failure of this sync.

## Known render warns

- `[RENDER_BLANK] Avatar` — an avatar with neither image nor fallback is
  genuinely empty. Expected, not a regression.
