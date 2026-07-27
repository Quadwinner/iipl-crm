/**
 * Document / attachment download flow (Task 12.8, Requirements 13.2, 13.3).
 *
 * Downloads are served as short-lived signed URLs. Access is enforced twice: the
 * row lookup runs under the caller's RLS (so a non-owner cannot even resolve the
 * object key), and `createSignedUrl` is itself gated by the storage.objects RLS
 * policies. Both the Admin_Portal and Owner_Portal use these helpers.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

/** Private Storage bucket ids. */
export const STORAGE_BUCKETS = {
  complaintAttachments: 'complaint-attachments',
  ownerDocuments: 'owner-documents',
  receipts: 'receipts',
} as const

/** Default signed-URL lifetime, kept short since URLs are minted on demand. */
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60

type DbClient = SupabaseClient<Database>

export interface SignedFile {
  signedUrl: string
  fileName: string
}

export class FileAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileAccessError'
  }
}

/**
 * Mints a signed URL for an object already known to be readable by the caller.
 * The bucket's RLS policies are the authorization boundary.
 */
export async function mintSignedUrl(
  client: DbClient,
  bucket: string,
  objectKey: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<string> {
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(objectKey, expiresInSeconds)

  if (error || !data?.signedUrl) {
    throw new FileAccessError('Not permitted to download this file')
  }
  return data.signedUrl
}

/**
 * Resolves a document row (RLS-scoped) and returns a signed URL for it. Throws a
 * generic access error when the caller cannot see the document (Requirement 13.6).
 */
export async function downloadDocument(
  client: DbClient,
  documentId: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<SignedFile> {
  const { data, error } = await client
    .from('document')
    .select('bucket_id, object_key, file_name')
    .eq('id', documentId)
    .maybeSingle()

  if (error || !data) {
    throw new FileAccessError('Not permitted to download this document')
  }

  const signedUrl = await mintSignedUrl(client, data.bucket_id, data.object_key, expiresInSeconds)
  return { signedUrl, fileName: data.file_name }
}

/**
 * Resolves a complaint attachment row (RLS-scoped) and returns a signed URL for it.
 */
export async function downloadAttachment(
  client: DbClient,
  attachmentId: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<SignedFile> {
  const { data, error } = await client
    .from('file_attachment')
    .select('bucket_id, object_key, file_name')
    .eq('id', attachmentId)
    .maybeSingle()

  if (error || !data) {
    throw new FileAccessError('Not permitted to download this attachment')
  }

  const signedUrl = await mintSignedUrl(client, data.bucket_id, data.object_key, expiresInSeconds)
  return { signedUrl, fileName: data.file_name }
}

/**
 * Resolves a receipt row (RLS-scoped) and returns a signed URL for its PDF
 * (Task 18.3, Requirements 10.2, 10.5).
 *
 * Access is enforced three ways: the row lookup runs under the caller's RLS (a
 * non-owner cannot resolve the receipt), an explicit service-layer check rejects any
 * receipt whose `office_owner_id` does not match the requester or whose backing
 * Payment is not completed, and `createSignedUrl` is gated by the receipts-bucket RLS
 * policy. The Receipt is downloadable the instant its row exists, independent of the
 * receipt Notification's delivery state (Requirement 10.2).
 */
export async function downloadReceipt(
  client: DbClient,
  requesterOwnerId: string,
  receiptId: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
): Promise<SignedFile> {
  const { data, error } = await client
    .from('receipt')
    .select('office_owner_id, document_ref, invoice_period, payment:payment_id ( status )')
    .eq('id', receiptId)
    .maybeSingle()

  if (error || !data) {
    throw new FileAccessError('Not permitted to download this receipt')
  }

  if (data.office_owner_id !== requesterOwnerId) {
    throw new FileAccessError('Not permitted to download this receipt')
  }

  const payment = data.payment as { status: string } | { status: string }[] | null
  const paymentStatus = Array.isArray(payment) ? payment[0]?.status : payment?.status
  if (paymentStatus !== 'COMPLETED') {
    throw new FileAccessError('Receipt has no associated completed payment')
  }

  if (!data.document_ref) {
    throw new FileAccessError('Receipt document is not yet available')
  }

  const signedUrl = await mintSignedUrl(
    client,
    STORAGE_BUCKETS.receipts,
    data.document_ref,
    expiresInSeconds,
  )
  return { signedUrl, fileName: `receipt-${data.invoice_period}.pdf` }
}
