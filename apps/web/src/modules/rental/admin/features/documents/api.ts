import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { downloadDocument, type Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { invokeEdgeFunctionMultipart } from '@rental-admin/lib/edge-function'
import { openSignedFile } from '@itoby/ui'
import { supabase } from '@rental-admin/lib/supabase'
import type { FileStorageConfigRow } from '@rental-admin/features/settings/api'

export interface DocumentRow {
  id: Uuid
  file_name: string
  file_extension: string
  size_bytes: number
  created_at: string
  lease_id: Uuid | null
  office_owner_id: Uuid | null
  owner_name: string
  lease_start: string | null
  lease_end: string | null
}

export interface LeaseOption {
  id: Uuid
  start_date: string
  end_date: string
  unit_code: string
}

export const documentKeys = {
  all: ['documents'] as const,
  list: (ownerId: Uuid | null) => ['documents', 'list', ownerId] as const,
  leases: (ownerId: Uuid | null) => ['documents', 'leases', ownerId] as const,
}

const LIST_SELECT =
  'id, file_name, file_extension, size_bytes, created_at, lease_id, office_owner_id, office_owners(name), lease(start_date, end_date)'

export function useDocuments(ownerId: Uuid | null) {
  return useQuery({
    queryKey: documentKeys.list(ownerId),
    queryFn: async (): Promise<DocumentRow[]> => {
      let query = supabase()
        .from('document')
        .select(LIST_SELECT)
        .order('created_at', { ascending: false })

      if (ownerId !== null) query = query.eq('office_owner_id', ownerId)

      const { data, error } = await query
      if (error) throw dbError(error, 'Documents could not be loaded.')

      return (data ?? []).map((row) => ({
        id: row.id,
        file_name: row.file_name,
        file_extension: row.file_extension,
        size_bytes: row.size_bytes,
        created_at: row.created_at,
        lease_id: row.lease_id,
        office_owner_id: row.office_owner_id,
        owner_name: row.office_owners?.name ?? '—',
        lease_start: row.lease?.start_date ?? null,
        lease_end: row.lease?.end_date ?? null,
      }))
    },
  })
}

/** Leases of one owner, resolved through their allotments, for the optional lease link. */
export function useOwnerLeases(ownerId: Uuid | null) {
  return useQuery({
    queryKey: documentKeys.leases(ownerId),
    enabled: ownerId !== null,
    queryFn: async (): Promise<LeaseOption[]> => {
      const { data, error } = await supabase()
        .from('lease')
        .select(
          'id, start_date, end_date, allotment!inner(office_owner_id, office_unit(unit_code))',
        )
        .eq('allotment.office_owner_id', ownerId as Uuid)
        .order('start_date', { ascending: false })
      if (error) throw dbError(error, 'Leases could not be loaded.')

      return (data ?? []).map((row) => ({
        id: row.id,
        start_date: row.start_date,
        end_date: row.end_date,
        unit_code: row.allotment?.office_unit?.unit_code ?? '—',
      }))
    },
  })
}

export interface UploadDocumentInput {
  file: File
  officeOwnerId: Uuid
  leaseId?: Uuid | null
}

interface UploadDocumentResponse {
  success: boolean
  data?: { id: Uuid; file_name: string }
}

/** Uploads run through the Edge Function, which re-validates type and size server-side. */
export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, officeOwnerId, leaseId }: UploadDocumentInput) => {
      const form = new FormData()
      form.append('file', file)
      form.append('office_owner_id', officeOwnerId)
      if (leaseId) form.append('lease_id', leaseId)
      return invokeEdgeFunctionMultipart<UploadDocumentResponse>('upload-document', form)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}

/** Downloads are short-lived signed URLs gated by Storage RLS (Requirements 13.2, 13.6). */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (documentId: Uuid) => {
      const file = await openSignedFile(() => downloadDocument(supabase(), documentId))
      return file.fileName
    },
  })
}

export function fileExtensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

/**
 * Client-side mirror of the Edge Function's checks so the operator is told before the
 * upload; the server remains the enforcement point (Requirement 13.5).
 */
export function fileRejection(file: File, config: FileStorageConfigRow[]): string | null {
  const extension = fileExtensionOf(file.name)
  const rule = config.find((row) => row.file_extension === extension)

  if (!rule || !rule.file_type_accepted) {
    return `Files of type .${extension || '(none)'} are not accepted.`
  }
  if (file.size > rule.max_file_size_mb * 1024 * 1024) {
    return `File is ${formatMegabytes(file.size)}, above the ${rule.max_file_size_mb} MB limit for .${extension} files.`
  }
  return null
}

export function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function acceptedTypesSummary(config: FileStorageConfigRow[]): string {
  const accepted = config.filter((row) => row.file_type_accepted)
  if (accepted.length === 0) return 'No file types are currently accepted.'
  return accepted.map((row) => `.${row.file_extension} (${row.max_file_size_mb} MB)`).join(', ')
}

export function acceptAttribute(config: FileStorageConfigRow[]): string {
  return config
    .filter((row) => row.file_type_accepted)
    .map((row) => `.${row.file_extension}`)
    .join(',')
}
