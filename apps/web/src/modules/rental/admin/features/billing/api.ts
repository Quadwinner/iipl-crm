import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  billingKeys,
  downloadInvoice,
  getBillingReport,
  type BillingFilters,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { invokeEdgeFunction } from '@rental-admin/lib/edge-function'
import { openSignedFile } from '@itoby/ui'
import { supabase } from '@rental-admin/lib/supabase'

export {
  billingKeys,
  billingTotals,
  EMPTY_BILLING_FILTERS,
  type BillingFilters,
  type BillingRow,
  type BillingTotals,
} from '@itoby/shared'

export function useBillingReport(filters: BillingFilters) {
  return useQuery({
    queryKey: billingKeys.report(filters),
    queryFn: () => getBillingReport(supabase(), filters),
  })
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
      const file = await openSignedFile(async () => {
        try {
          return await downloadInvoice(supabase(), invoiceId)
        } catch {
          // No PDF rendered yet: kick off the render, then retry once.
          await generate.mutateAsync(invoiceId)
          return await downloadInvoice(supabase(), invoiceId)
        }
      })
      return file.fileName
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
