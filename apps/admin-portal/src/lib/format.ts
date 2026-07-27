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

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : dateOnly.format(parsed)
}

/** True when a lease end date is strictly in the past, in the operator's local calendar. */
export function isPastDate(value: string | null | undefined): boolean {
  if (!value) return false
  return value.slice(0, 10) < todayIsoDate()
}

export function todayIsoDate(): string {
  const now = new Date()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
