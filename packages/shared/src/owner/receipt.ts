import type { TypedSupabaseClient } from '../supabase/client'
import type { GatewayType, Uuid } from '../types/domain'
import { dbError } from './db-error'
import { invokeEdgeFunction } from './edge-function'

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
export async function listOwnerReceipts(client: TypedSupabaseClient): Promise<ReceiptRow[]> {
  const { data, error } = await client
    .from('receipt')
    .select(
      'id, invoice_period, office_unit_code, amount_paid, payment_gateway, transaction_ref, completed_at, generated_at, document_ref',
    )
    .order('completed_at', { ascending: false })

  if (error) throw dbError(error, 'Your receipts could not be loaded.')
  return data ?? []
}

/** Triggers async PDF generation when document_ref is still null after payment. */
export async function generateReceiptPdf(
  client: TypedSupabaseClient,
  receiptId: Uuid,
): Promise<Uuid> {
  await invokeEdgeFunction<{ success: boolean }>(client, 'receipt-pdf', { receipt_id: receiptId })
  return receiptId
}
