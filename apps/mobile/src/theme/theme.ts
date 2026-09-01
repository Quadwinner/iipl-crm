import { colors, radius, space, statusColor } from '@itoby/shared/theme'

/**
 * The app's design tokens, re-exported from @itoby/shared so the palette matches
 * the website's rather than approximating it. Anything genuinely app-only —
 * layout constants that have no web equivalent — belongs here, not in shared.
 */
export const theme = {
  color: {
    bg: colors.ink,
    surface: colors.ink2,
    surfaceAlt: '#181c22',
    border: colors.line,
    text: colors.fg,
    muted: colors.fg2,
    accent: colors.lime,
    accentDim: colors.limeDim,
    accentText: colors.ink,
    cyan: colors.cyan,
    danger: colors.danger,
    warn: colors.warn,
    ok: colors.ok,
  },
  radius,
  space,
} as const

export { statusColor }
