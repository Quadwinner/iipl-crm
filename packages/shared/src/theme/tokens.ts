/**
 * The Itoby palette, in one place.
 *
 * The web site defines these as `oklch()` custom properties in
 * `apps/web/src/routes/home-page.css`. React Native supports neither CSS custom
 * properties nor the oklch colour space, so the same colours are kept here as
 * sRGB hex — converted from those oklch values, not eyeballed.
 *
 * This is one source with two consumers rather than one artifact: the web reads
 * its CSS, the app reads this file. Changing a brand colour means changing both,
 * and nothing but review catches a drift. That tradeoff is deliberate — the
 * alternative is a build step generating CSS from here, which is more machinery
 * than a small palette warrants.
 */

/** Semantic roles every scheme must fill. */
export interface Palette {
  /** Page background. */
  ink: string
  /** Raised surface: cards, tab bars. */
  ink2: string
  /** A surface raised above ink2 — pressed rows, nested panels. */
  ink3: string
  /** Hairline borders. */
  line: string
  /** Primary accent. */
  lime: string
  /** Accent for larger fills, where full lime is too loud. */
  limeDim: string
  /** Text that sits *on* the accent. */
  onLime: string
  /** Secondary accent. */
  cyan: string
  /** Body text. */
  fg: string
  /** Muted text. */
  fg2: string
  danger: string
  warn: string
  ok: string
}

/** The brand's native scheme — the one the website uses. */
export const dark: Palette = {
  ink: '#080a0e',
  ink2: '#111419',
  ink3: '#181c22',
  line: 'rgba(255,255,255,0.09)',
  lime: '#a9f300',
  limeDim: '#81b900',
  onLime: '#080a0e',
  cyan: '#1ad1d1',
  fg: '#f8f8fa',
  fg2: '#a0a5ac',
  danger: '#f76c5e',
  warn: '#f2b441',
  ok: '#5fd68a',
}

/**
 * The light scheme.
 *
 * Not an inversion: the same lime that glows on near-black fails contrast on
 * white, so text and borders darken while the accent stays a fill colour with
 * dark text on it. Status colours are darkened for the same reason.
 */
export const light: Palette = {
  ink: '#fbfbfa',
  ink2: '#ffffff',
  ink3: '#f2f3f1',
  line: 'rgba(8,10,14,0.12)',
  lime: '#8fd400',
  limeDim: '#6fa500',
  onLime: '#080a0e',
  cyan: '#0f9c9c',
  fg: '#101317',
  fg2: '#5b626b',
  danger: '#c2402f',
  warn: '#a97400',
  ok: '#1f8f4d',
}

export type SchemeName = 'light' | 'dark'

export const palettes: Record<SchemeName, Palette> = { light, dark }

/** Kept as a named export so existing imports of `colors` still resolve to dark. */
export const colors = dark

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const

/** 4px base scale, matching the web's Tailwind spacing. */
export function space(steps: number): number {
  return steps * 4
}

/**
 * Maps a domain status to a colour. Shared so a PAID invoice and a RESOLVED
 * complaint look the same everywhere; unknown values stay muted rather than
 * guessing.
 */
export function statusColorFor(palette: Palette, status: string): string {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
    case 'ACTIVE':
      return palette.ok
    case 'OVERDUE':
    case 'FAILED':
    case 'CANCELLED':
    case 'DISABLED':
      return palette.danger
    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'IN_PROGRESS':
    case 'OPEN':
    case 'BETA':
    case 'COMING_SOON':
      return palette.warn
    default:
      return palette.fg2
  }
}

/** Dark-scheme convenience, for callers with no palette in hand. */
export function statusColor(status: string): string {
  return statusColorFor(dark, status)
}
