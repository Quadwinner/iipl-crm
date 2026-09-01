import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { ExpenseCategory, InvoiceStatus, Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export type BillingRow = Database['public']['Functions']['get_billing_report']['Returns'][number]
export type ExpenseRow =
  Database['public']['Functions']['list_building_expenses']['Returns'][number]

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

export async function getBillingReport(
  client: TypedSupabaseClient,
  filters: BillingFilters,
): Promise<BillingRow[]> {
  const { data, error } = await client.rpc('get_billing_report', {
    p_building_id: filters.buildingId ?? undefined,
    p_office_owner_id: filters.officeOwnerId ?? undefined,
    p_status: filters.status ?? undefined,
  })
  if (error) throw dbError(error, 'The billing report could not be loaded.')
  return data ?? []
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

export interface ExpenseFilters {
  buildingId: Uuid | null
  category: ExpenseCategory | null
  startDate: string
  endDate: string
}

export const EMPTY_EXPENSE_FILTERS: ExpenseFilters = {
  buildingId: null,
  category: null,
  startDate: '',
  endDate: '',
}

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ExpenseFilters) =>
    [
      'expenses',
      'list',
      filters.buildingId,
      filters.category,
      filters.startDate,
      filters.endDate,
    ] as const,
}

export async function listExpenses(
  client: TypedSupabaseClient,
  filters: ExpenseFilters,
): Promise<ExpenseRow[]> {
  const { data, error } = await client.rpc('list_building_expenses', {
    p_building_id: filters.buildingId ?? undefined,
    p_category: filters.category ?? undefined,
    p_start_date: filters.startDate || undefined,
    p_end_date: filters.endDate || undefined,
  })
  if (error) throw dbError(error, 'Expenses could not be loaded.')
  return data ?? []
}

export function expenseTotals(rows: ExpenseRow[]): { count: number; total: number } {
  return rows.reduce(
    (acc, row) => ({ count: acc.count + 1, total: acc.total + Number(row.amount) }),
    { count: 0, total: 0 },
  )
}
