import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { downloadInvoice, type Database, type InvoiceStatus, type Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { invokeEdgeFunction } from '@rental-admin/lib/edge-function'
import { supabase } from '@rental-admin/lib/supabase'

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

export function useSetElectricityCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      invoiceId: Uuid
      amount: number
      note?: string
      units?: number | null
    }) => {
      const { data, error } = await supabase().rpc('set_invoice_electricity_charge', {
        p_invoice_id: input.invoiceId,
        p_amount: input.amount,
        p_note: input.note || undefined,
        p_units: input.units ?? undefined,
      })
      if (error) throw dbError(error, 'The electricity charge could not be saved.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['tenants'] })
      void queryClient.invalidateQueries({ queryKey: ['reporting'] })
    },
  })
}

export function useSetMaintenanceCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { invoiceId: Uuid; amount: number }) => {
      const { data, error } = await supabase().rpc('set_invoice_maintenance_charge', {
        p_invoice_id: input.invoiceId,
        p_amount: input.amount,
      })
      if (error) throw dbError(error, 'The maintenance fee could not be saved.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['tenants'] })
      void queryClient.invalidateQueries({ queryKey: ['reporting'] })
    },
  })
}

export function useGenerateInvoicePdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: Uuid) => {
      await invokeEdgeFunction<{ success: boolean }>('invoice-pdf', { invoice_id: invoiceId })
      return invoiceId
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: billingKeys.all })
    },
  })
}

export function useDownloadInvoicePdf() {
  const generate = useGenerateInvoicePdf()

  return useMutation({
    mutationFn: async (invoiceId: Uuid) => {
      try {
        const file = await downloadInvoice(supabase(), invoiceId)
        window.open(file.signedUrl, '_blank', 'noopener,noreferrer')
        return file.fileName
      } catch {
        await generate.mutateAsync(invoiceId)
        const file = await downloadInvoice(supabase(), invoiceId)
        window.open(file.signedUrl, '_blank', 'noopener,noreferrer')
        return file.fileName
      }
    },
  })
}

/** Queues email / SMS / in-app bill reminders for one unpaid invoice. */
export function useSendInvoiceReminder() {
  return useMutation({
    mutationFn: async (invoiceId: Uuid) => {
      const { data, error } = await supabase().rpc('send_invoice_reminder', {
        p_invoice_id: invoiceId,
      })
      if (error) throw dbError(error, 'The bill reminder could not be sent.')

      // Flush the notify queue so the tenant receives it promptly.
      try {
        await invokeEdgeFunction<{ success?: boolean }>('notify', {})
      } catch {
        // Delivery still runs on the scheduled notify cron if this fails.
      }

      return data
    },
  })
}
