import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { downloadInvoice, type Database, type GatewayType, type Uuid } from '@itoby/shared'
import { dbError } from '@rental-owner/lib/db-error'
import { invokeEdgeFunction } from '@rental-owner/lib/edge-function'
import { supabase } from '@rental-owner/lib/supabase'

type OwnerInvoiceRow = Database['public']['Functions']['get_invoices_for_owner']['Returns'][number]

export interface InvoiceRow extends OwnerInvoiceRow {
  /** Sum of the invoice's COMPLETED payments. */
  paid_amount: number
  /** total_amount minus paid_amount, floored at 0 — the upper bound for a new payment. */
  outstanding_amount: number
}

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: () => ['invoices', 'list'] as const,
}

export const paymentKeys = {
  all: ['payments'] as const,
}

/**
 * Both reads are owner-scoped by the backend: `get_invoices_for_owner` resolves the owner
 * from `auth.uid()` and takes no owner argument, and the `payment` read runs under
 * owner-scoped RLS. No client-supplied owner id is involved (Requirement 4.8).
 */
export function useOwnerInvoices() {
  return useQuery({
    queryKey: invoiceKeys.list(),
    queryFn: async (): Promise<InvoiceRow[]> => {
      const client = supabase()

      const [invoices, payments] = await Promise.all([
        client.rpc('get_invoices_for_owner'),
        client.from('payment').select('invoice_id, amount').eq('status', 'COMPLETED'),
      ])

      if (invoices.error) throw dbError(invoices.error, 'Your invoices could not be loaded.')
      if (payments.error) throw dbError(payments.error, 'Your payments could not be loaded.')

      const paidByInvoice = new Map<string, number>()
      for (const payment of payments.data ?? []) {
        paidByInvoice.set(
          payment.invoice_id,
          (paidByInvoice.get(payment.invoice_id) ?? 0) + payment.amount,
        )
      }

      return (invoices.data ?? []).map((invoice) => {
        const paid = paidByInvoice.get(invoice.invoice_id) ?? 0
        return {
          ...invoice,
          paid_amount: paid,
          outstanding_amount: Math.max(0, round2(invoice.total_amount - paid)),
        }
      })
    },
  })
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export interface PaymentIntentResult {
  reference: string
  gateway: GatewayType
  invoice_id: Uuid
  amount: number
  gateway_data: Record<string, unknown>
}

interface PaymentIntentResponse {
  success: boolean
  data?: PaymentIntentResult
}

/**
 * Payment initiation goes through the `create-payment-intent` Edge Function, which holds
 * the gateway secret and records the PENDING attempt via `initiate_payment` under the
 * caller's own JWT. The browser never sees a gateway secret key.
 */
export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (input: {
      invoiceId: Uuid
      gateway: GatewayType
      amount: number
    }): Promise<PaymentIntentResult> => {
      const response = await invokeEdgeFunction<PaymentIntentResponse>('create-payment-intent', {
        invoice_id: input.invoiceId,
        gateway: input.gateway,
        amount: input.amount,
      })
      if (!response.data) {
        throw new Error('The payment could not be started. Try again in a moment.')
      }
      return response.data
    },
  })
}

/** Confirmation arrives asynchronously by gateway webhook, so refresh what it can change. */
export function useRefreshAfterPayment() {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    void queryClient.invalidateQueries({ queryKey: paymentKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['receipts'] })
  }
}

export function useGenerateInvoicePdf() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId: Uuid) => {
      await invokeEdgeFunction<{ success: boolean }>('invoice-pdf', { invoice_id: invoiceId })
      return invoiceId
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
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
