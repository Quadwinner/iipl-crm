import type { TypedSupabaseClient } from '../supabase/client'
import type { Uuid } from '../types/domain'
import { dbError } from './db-error'

export interface OwnerDocumentRow {
  id: Uuid
  file_name: string
  file_extension: string
  size_bytes: number
  created_at: string
  lease_id: Uuid | null
  lease_start: string | null
  lease_end: string | null
  unit_code: string | null
}

export const documentKeys = {
  all: ['documents'] as const,
  list: (ownerId: Uuid) => ['documents', 'list', ownerId] as const,
}

/**
 * Owner-scoped by RLS on `document`: only rows linked to the caller's own lease or
 * owner account are returned (Requirements 13.3, 13.6).
 */
export async function listOwnerDocuments(
  client: TypedSupabaseClient,
): Promise<OwnerDocumentRow[]> {
  const { data, error } = await client
    .from('document')
    .select(
      'id, file_name, file_extension, size_bytes, created_at, lease_id, lease(start_date, end_date, allotment(office_unit(unit_code)))',
    )
    .order('created_at', { ascending: false })

  if (error) throw dbError(error, 'Your documents could not be loaded.')

  return (data ?? []).map((row) => ({
    id: row.id,
    file_name: row.file_name,
    file_extension: row.file_extension,
    size_bytes: row.size_bytes,
    created_at: row.created_at,
    lease_id: row.lease_id,
    lease_start: row.lease?.start_date ?? null,
    lease_end: row.lease?.end_date ?? null,
    unit_code: row.lease?.allotment?.office_unit?.unit_code ?? null,
  }))
}
