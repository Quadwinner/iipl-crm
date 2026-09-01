import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPaymentIntent,
  downloadInvoice,
  generateInvoicePdf,
  invoiceKeys,
  listOwnerInvoices,
  paymentKeys,
  type PaymentIntentInput,
  type Uuid,
} from '@itoby/shared'
import { supabase } from '@rental-owner/lib/supabase'

export {
  invoiceKeys,
  paymentKeys,
  type InvoiceRow,
  type PaymentIntentResult,
} from '@itoby/shared'

export function useOwnerInvoices() {
  return useQuery({
    queryKey: invoiceKeys.list(),
    queryFn: () => listOwnerInvoices(supabase()),
  })
}

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (input: PaymentIntentInput) => createPaymentIntent(supabase(), input),
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
    mutationFn: (invoiceId: Uuid) => generateInvoicePdf(supabase(), invoiceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

/** Opening the signed URL is browser-specific, so it stays here rather than in the shared layer. */
export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: async (invoiceId: Uuid) => {
      try {
        const file = await downloadInvoice(supabase(), invoiceId)
        window.open(file.signedUrl, '_blank', 'noopener,noreferrer')
        return file.fileName
      } catch {
        // No PDF rendered yet: kick off the render, then retry once.
        await generateInvoicePdf(supabase(), invoiceId)
        const file = await downloadInvoice(supabase(), invoiceId)
        window.open(file.signedUrl, '_blank', 'noopener,noreferrer')
        return file.fileName
      }
    },
  })
}
