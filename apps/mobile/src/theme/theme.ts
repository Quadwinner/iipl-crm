/**
 * The app's design tokens. Kept as plain values rather than a styling library so
 * the whole app stays readable in one file's worth of vocabulary.
 */
export const theme = {
  color: {
    bg: '#0B0D0E',
    surface: '#15181A',
    surfaceAlt: '#1D2123',
    border: '#2A2F32',
    text: '#F2F4F3',
    muted: '#8B9499',
    accent: '#C8F751',
    accentText: '#0B0D0E',
    danger: '#F76C5E',
    warn: '#F2B441',
    ok: '#5FD68A',
  },
  radius: { sm: 8, md: 12, lg: 18 },
  space: (n: number) => n * 4,
} as const

/** Maps a status string to a badge colour; unknown statuses fall back to muted. */
export function statusColor(status: string): string {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'RESOLVED':
    case 'CLOSED':
    case 'ACTIVE':
      return theme.color.ok
    case 'OVERDUE':
    case 'FAILED':
    case 'CANCELLED':
      return theme.color.danger
    case 'PENDING':
    case 'PARTIALLY_PAID':
    case 'IN_PROGRESS':
    case 'OPEN':
      return theme.color.warn
    default:
      return theme.color.muted
  }
}
