/**
 * Dashboard date-range helpers (Task 25.4, Requirement 12.6).
 *
 * The authoritative rejection of an inverted range lives in the database
 * (`assert_valid_date_range`, errcode 22023), enforced inside the revenue dashboard
 * and the export RPC. This module mirrors that rule client-side so the portal can
 * surface a descriptive error before a round trip, and provides the "current calendar
 * month" default the dashboards fall back to when no range is supplied (12.2).
 */

import type { IsoDate } from '../types/domain'

/** An inclusive calendar date range used by the revenue dashboard and exports. */
export interface DateRange {
  startDate: IsoDate
  endDate: IsoDate
}

/** Raised when a selected range has its start date after its end date (Requirement 12.6). */
export class DateRangeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DateRangeError'
  }
}

/**
 * Rejects a range whose start date is after its end date. Mirrors the database guard so
 * an invalid selection is caught before it is sent (Requirement 12.6).
 */
export function assertValidDateRange(range: DateRange): void {
  if (range.startDate > range.endDate) {
    throw new DateRangeError(
      `Invalid date range: start date (${range.startDate}) must not be after end date (${range.endDate}).`,
    )
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * The current calendar month as an inclusive range, matching the database default used
 * when no range is selected (Requirement 12.2). Computed in UTC for determinism.
 */
export function currentCalendarMonth(now: Date = new Date()): DateRange {
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() // 0-based
  const firstDay = 1
  // Day 0 of the next month is the last day of this month.
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return {
    startDate: `${year}-${pad2(month + 1)}-${pad2(firstDay)}`,
    endDate: `${year}-${pad2(month + 1)}-${pad2(lastDay)}`,
  }
}

/**
 * Resolves the effective range for a request: validates a supplied range, or falls back
 * to the current calendar month when none is given.
 */
export function resolveDateRange(range?: DateRange, now: Date = new Date()): DateRange {
  if (!range) {
    return currentCalendarMonth(now)
  }
  assertValidDateRange(range)
  return range
}
