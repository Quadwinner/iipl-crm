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
 * than a seven-colour palette warrants.
 */
export const colors = {
  /** Page background — oklch(0.145 0.008 260). */
  ink: '#080a0e',
  /** Raised surface — oklch(0.19 0.012 260). */
  ink2: '#111419',
  /** Hairline borders. White at 9%, as `--line`. */
  line: 'rgba(255,255,255,0.09)',
  /** Primary accent — oklch(0.88 0.24 128). */
  lime: '#a9f300',
  /** Accent for larger fills, where full lime is too loud. */
  limeDim: '#81b900',
  /** Secondary accent — oklch(0.78 0.13 195). */
  cyan: '#1ad1d1',
  /** Body text — oklch(0.98 0.002 260). */
  fg: '#f8f8fa',
  /** Muted text — oklch(0.72 0.012 260). */
  fg2: '#a0a5ac',
  /** Status colours. No web equivalent; used for badges and error states. */
  danger: '#f76c5e',
  warn: '#f2b441',
  ok: '#5fd68a',
} as const

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
export function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
    case 'ACTIVE':
      return colors.ok
    case 'OVERDUE':
    case 'FAILED':
    case 'CANCELLED':
    case 'DISABLED':
      return colors.danger
    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'IN_PROGRESS':
    case 'OPEN':
    case 'BETA':
    case 'COMING_SOON':
      return colors.warn
    default:
      return colors.fg2
  }
}
