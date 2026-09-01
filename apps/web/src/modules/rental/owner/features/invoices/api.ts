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
import { openSignedFile } from '@itoby/ui'
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
      const file = await openSignedFile(async () => {
        try {
          return await downloadInvoice(supabase(), invoiceId)
        } catch {
          // No PDF rendered yet: kick off the render, then retry once.
          await generateInvoicePdf(supabase(), invoiceId)
          return await downloadInvoice(supabase(), invoiceId)
        }
      })
      return file.fileName
    },
  })
}
