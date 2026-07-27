/**
 * Admin dashboard read wrappers (Tasks 25.1, 25.2, Requirement 12.1-12.4).
 *
 * Thin, typed clients over the Administrator-gated `get_occupancy_dashboard` and
 * `get_revenue_dashboard` RPCs. All aggregation, the current-calendar-month default,
 * the Building filter, and the inverted-range rejection are enforced in the database;
 * these wrappers surface the results to the portal and normalise the single-row shape.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import type { IsoDate, Uuid } from '../types/domain'
import { type DateRange, DateRangeError, assertValidDateRange } from './date-range'

type DbClient = SupabaseClient<Database>

/** Occupancy figures for the whole inventory or a single Building (Requirement 12.1). */
export interface OccupancyDashboard {
  totalUnits: number
  occupiedCount: number
  vacantCount: number
  /** round(occupied / total * 100); 0 when there are no units. */
  occupancyRatePercent: number
}

/** Revenue figures for the effective date range and optional Building (Requirement 12.2). */
export interface RevenueDashboard {
  rangeStart: IsoDate
  rangeEnd: IsoDate
  totalRentCollected: number
  totalOutstandingDues: number
  overdueInvoiceCount: number
}

/** Raised when a dashboard read is rejected by the database. */
export class ReportingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReportingError'
  }
}

/**
 * Occupancy dashboard: total/occupied/vacant counts and the occupancy rate, optionally
 * scoped to one Building (Requirements 12.1, 12.3, 12.4).
 */
export async function getOccupancyDashboard(
  client: DbClient,
  buildingId?: Uuid,
): Promise<OccupancyDashboard> {
  const { data, error } = await client.rpc('get_occupancy_dashboard', {
    p_building_id: buildingId ?? undefined,
  })

  if (error) {
    throw new ReportingError(error.message)
  }

  const row = data?.[0]
  if (!row) {
    return { totalUnits: 0, occupiedCount: 0, vacantCount: 0, occupancyRatePercent: 0 }
  }

  return {
    totalUnits: row.total_units,
    occupiedCount: row.occupied_count,
    vacantCount: row.vacant_count,
    occupancyRatePercent: row.occupancy_rate_percent,
  }
}

/**
 * Revenue dashboard: total rent collected, total outstanding dues, and overdue Invoice
 * count for the selected range (default: current calendar month) and optional Building
 * (Requirements 12.2, 12.3, 12.4). Rejects an inverted range client-side before the call
 * and maps the database's 22023 rejection to a {@link DateRangeError} (Requirement 12.6).
 */
export async function getRevenueDashboard(
  client: DbClient,
  range?: DateRange,
  buildingId?: Uuid,
): Promise<RevenueDashboard> {
  if (range) {
    assertValidDateRange(range)
  }

  const { data, error } = await client.rpc('get_revenue_dashboard', {
    p_start_date: range?.startDate ?? undefined,
    p_end_date: range?.endDate ?? undefined,
    p_building_id: buildingId ?? undefined,
  })

  if (error) {
    if (error.code === '22023') {
      throw new DateRangeError(error.message)
    }
    throw new ReportingError(error.message)
  }

  const row = data?.[0]
  if (!row) {
    throw new ReportingError('Revenue dashboard returned no rows')
  }

  return {
    rangeStart: row.range_start,
    rangeEnd: row.range_end,
    totalRentCollected: Number(row.total_rent_collected),
    totalOutstandingDues: Number(row.total_outstanding_dues),
    overdueInvoiceCount: row.overdue_invoice_count,
  }
}
