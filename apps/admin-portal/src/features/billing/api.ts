import { useQuery } from '@tanstack/react-query'
import type { Database, InvoiceStatus, Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export type BillingRow = Database['public']['Functions']['get_billing_report']['Returns'][number]

export interface BillingFilters {
  buildingId: Uuid | null
  officeOwnerId: Uuid | null
  status: InvoiceStatus | null
}

export const EMPTY_BILLING_FILTERS: BillingFilters = {
  buildingId: null,
  officeOwnerId: null,
  status: null,
}

export const billingKeys = {
  all: ['billing'] as const,
  report: (filters: BillingFilters) =>
    ['billing', 'report', filters.buildingId, filters.officeOwnerId, filters.status] as const,
}

export function useBillingReport(filters: BillingFilters) {
  return useQuery({
    queryKey: billingKeys.report(filters),
    queryFn: async (): Promise<BillingRow[]> => {
      const { data, error } = await supabase().rpc('get_billing_report', {
        p_building_id: filters.buildingId ?? undefined,
        p_office_owner_id: filters.officeOwnerId ?? undefined,
        p_status: filters.status ?? undefined,
      })
      if (error) throw dbError(error, 'The billing report could not be loaded.')
      return data ?? []
    },
  })
}

export interface BillingTotals {
  invoiceCount: number
  invoicedTotal: number
  outstandingTotal: number
  overdueTotal: number
}

/** Anything not fully Paid is still owed, so dues sum every other status. */
export function billingTotals(rows: BillingRow[]): BillingTotals {
  return rows.reduce<BillingTotals>(
    (totals, row) => ({
      invoiceCount: totals.invoiceCount + 1,
      invoicedTotal: totals.invoicedTotal + row.total_amount,
      outstandingTotal: totals.outstandingTotal + (row.status === 'PAID' ? 0 : row.total_amount),
      overdueTotal: totals.overdueTotal + (row.status === 'OVERDUE' ? row.total_amount : 0),
    }),
    { invoiceCount: 0, invoicedTotal: 0, outstandingTotal: 0, overdueTotal: 0 },
  )
}
