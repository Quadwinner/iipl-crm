import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  downloadReceipt,
  generateReceiptPdf,
  listOwnerReceipts,
  receiptKeys,
  type Uuid,
} from '@itoby/shared'
import { openSignedFile } from '@itoby/ui'
import { supabase } from '@rental-owner/lib/supabase'

export { receiptKeys, type ReceiptRow } from '@itoby/shared'

export function useOwnerReceipts(ownerId: Uuid) {
  return useQuery({
    queryKey: receiptKeys.list(ownerId),
    queryFn: () => listOwnerReceipts(supabase()),
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
      const file = await openSignedFile(() => downloadReceipt(supabase(), ownerId, receiptId))
      return file.fileName
    },
  })
}

/** Triggers async PDF generation when document_ref is still null after payment. */
export function useGenerateReceiptPdf(ownerId: Uuid) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (receiptId: Uuid) => generateReceiptPdf(supabase(), receiptId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: receiptKeys.list(ownerId) })
    },
  })
}
