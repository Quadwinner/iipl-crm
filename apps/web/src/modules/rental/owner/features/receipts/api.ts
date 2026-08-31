import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { downloadReceipt, type GatewayType, type Uuid } from '@itoby/shared'
import { dbError } from '@rental-owner/lib/db-error'
import { invokeEdgeFunction } from '@rental-owner/lib/edge-function'
import { supabase } from '@rental-owner/lib/supabase'

export interface ReceiptRow {
  id: Uuid
  invoice_period: string
  office_unit_code: string
  amount_paid: number
  payment_gateway: GatewayType
  transaction_ref: string | null
  completed_at: string
  generated_at: string
  /** Null until the receipt PDF render finishes. */
  document_ref: string | null
}

export const receiptKeys = {
  all: ['receipts'] as const,
  list: (ownerId: Uuid) => ['receipts', 'list', ownerId] as const,
}

/** Owner-scoped by RLS on `receipt`; no owner id is sent as the authorization basis. */
export function useOwnerReceipts(ownerId: Uuid) {
  return useQuery({
    queryKey: receiptKeys.list(ownerId),
    queryFn: async (): Promise<ReceiptRow[]> => {
      const { data, error } = await supabase()
        .from('receipt')
        .select(
          'id, invoice_period, office_unit_code, amount_paid, payment_gateway, transaction_ref, completed_at, generated_at, document_ref',
        )
        .order('completed_at', { ascending: false })

      if (error) throw dbError(error, 'Your receipts could not be loaded.')
      return data ?? []
    },
  })
}

/**
 * The shared helper re-checks that the receipt belongs to the requester and that its
 * Payment is completed, on top of the receipt/bucket RLS policies (Requirement 10.5).
 * `ownerId` is the identity resolved server-side at sign-in, not a user-entered value.
 */
export function useDownloadReceipt(ownerId: Uuid) {
  return useMutation({
    mutationFn: async (receiptId: Uuid) => {
      const file = await downloadReceipt(supabase(), ownerId, receiptId)
      window.open(file.signedUrl, '_blank', 'noopener,noreferrer')
      return file.fileName
    },
  })
}

/** Triggers async PDF generation when document_ref is still null after payment. */
export function useGenerateReceiptPdf(ownerId: Uuid) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (receiptId: Uuid) => {
      await invokeEdgeFunction<{ success: boolean }>('receipt-pdf', { receipt_id: receiptId })
      return receiptId
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receiptKeys.list(ownerId) })
    },
  })
}
