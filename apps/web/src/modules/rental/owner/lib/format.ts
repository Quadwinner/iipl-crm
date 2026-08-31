const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const dateOnly = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const dateAndTime = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatCurrency(amount: number | null | undefined): string {
  return amount === null || amount === undefined ? '—' : currency.format(amount)
}

/** Formats a Postgres `date` (`YYYY-MM-DD`) without shifting it across timezones. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return '—'
  return dateOnly.format(new Date(Date.UTC(year, month - 1, day)))
}

export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : dateAndTime.format(parsed)
}

export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
