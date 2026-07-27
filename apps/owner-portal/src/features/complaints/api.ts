import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  COMPLAINT_ATTACHMENT_MAX_BYTES,
  COMPLAINT_ATTACHMENT_MAX_COUNT,
  type ComplaintSubmissionInput,
  type Database,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { EdgeFunctionError, invokeEdgeFunctionMultipart } from '@/lib/edge-function'
import { formatFileSize } from '@/lib/format'
import { supabase } from '@/lib/supabase'

export type ComplaintRow =
  Database['public']['Functions']['list_complaints_for_owner']['Returns'][number]
export type ComplaintEventRow =
  Database['public']['Functions']['get_complaint_history']['Returns'][number]

export interface AllottedUnit {
  id: Uuid
  unit_code: string
  building_name: string
}

export interface FileTypeRule {
  file_extension: string
  file_type_accepted: boolean
  max_file_size_mb: number
}

export const complaintKeys = {
  all: ['complaints'] as const,
  list: () => ['complaints', 'list'] as const,
  events: (complaintId: Uuid) => ['complaints', 'events', complaintId] as const,
  categories: ['complaint-categories'] as const,
  allottedUnits: ['allotted-units'] as const,
  fileTypes: ['file-types'] as const,
}

/** `list_complaints_for_owner` resolves the owner from `auth.uid()` and takes no argument. */
export function useOwnerComplaints() {
  return useQuery({
    queryKey: complaintKeys.list(),
    queryFn: async (): Promise<ComplaintRow[]> => {
      const { data, error } = await supabase().rpc('list_complaints_for_owner')
      if (error) throw dbError(error, 'Your complaints could not be loaded.')
      return data ?? []
    },
  })
}

/**
 * `get_complaint_history` returns the acting user's display name alongside each event;
 * `complaint_event` alone cannot, because owners cannot read staff `profiles` rows.
 */
export function useComplaintEvents(complaintId: Uuid | null) {
  return useQuery({
    queryKey: complaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: async (): Promise<ComplaintEventRow[]> => {
      const { data, error } = await supabase().rpc('get_complaint_history', {
        p_complaint_id: complaintId as Uuid,
      })
      if (error) throw dbError(error, 'The status history could not be loaded.')
      return data ?? []
    },
  })
}

export function useComplaintCategories() {
  return useQuery({
    queryKey: complaintKeys.categories,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase()
        .from('complaint_categories')
        .select('name')
        .eq('is_active', true)
        .order('name')
      if (error) throw dbError(error, 'Complaint categories could not be loaded.')
      return (data ?? []).map((row) => row.name)
    },
  })
}

/**
 * The owner's currently-allotted units, read through owner-scoped RLS on `allotment`.
 * `submit_complaint` re-checks the allotment server-side (Requirement 6.4).
 */
export function useAllottedUnits() {
  return useQuery({
    queryKey: complaintKeys.allottedUnits,
    queryFn: async (): Promise<AllottedUnit[]> => {
      const { data, error } = await supabase()
        .from('allotment')
        .select('office_unit_id, office_unit(unit_code, building(name))')
        .eq('status', 'ACTIVE')

      if (error) throw dbError(error, 'Your office units could not be loaded.')

      return (data ?? [])
        .map((row) => ({
          id: row.office_unit_id,
          unit_code: row.office_unit?.unit_code ?? '—',
          building_name: row.office_unit?.building?.name ?? '—',
        }))
        .sort((a, b) => a.unit_code.localeCompare(b.unit_code))
    },
  })
}

export function useFileTypeRules() {
  return useQuery({
    queryKey: complaintKeys.fileTypes,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<FileTypeRule[]> => {
      const { data, error } = await supabase()
        .from('file_storage_config')
        .select('file_extension, file_type_accepted, max_file_size_mb')
        .order('file_extension')
      if (error) throw dbError(error, 'Accepted file types could not be loaded.')
      return data ?? []
    },
  })
}

export interface SubmitComplaintInput extends ComplaintSubmissionInput {
  attachments: File[]
}

export interface SubmitComplaintResult {
  complaintId: Uuid
  /** Per-file server rejections; the complaint itself was created. */
  attachmentErrors: string[]
}

interface AttachmentResponse {
  success: boolean
  data?: { id: Uuid }
}

/**
 * Creates the complaint through `submit_complaint` (which validates the allotment,
 * category, and description length), then uploads each attachment through the
 * `upload-attachment` Edge Function, which re-validates count, size, and type.
 */
export function useSubmitComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SubmitComplaintInput): Promise<SubmitComplaintResult> => {
      const { data, error } = await supabase().rpc('submit_complaint', {
        p_office_unit_id: input.office_unit_id,
        p_category: input.category,
        p_description: input.description,
      })
      if (error) throw dbError(error, 'Your complaint could not be submitted.')

      const complaintId = (data as { id: Uuid }).id
      const attachmentErrors: string[] = []

      for (const file of input.attachments) {
        const form = new FormData()
        form.append('complaint_id', complaintId)
        form.append('file', file)
        try {
          await invokeEdgeFunctionMultipart<AttachmentResponse>('upload-attachment', form)
        } catch (cause) {
          attachmentErrors.push(
            `${file.name}: ${cause instanceof EdgeFunctionError || cause instanceof Error ? cause.message : String(cause)}`,
          )
        }
      }

      return { complaintId, attachmentErrors }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

/**
 * Client-side mirror of the Edge Function's checks so the owner is told before uploading;
 * the server stays the enforcement point (Requirements 6.1, 6.5).
 */
export function attachmentRejection(file: File, rules: FileTypeRule[]): string | null {
  const extension = extensionOf(file.name)
  const rule = rules.find((row) => row.file_extension === extension)

  if (!rule || !rule.file_type_accepted) {
    return `Files of type .${extension || '(none)'} are not accepted.`
  }

  const limitBytes = Math.min(COMPLAINT_ATTACHMENT_MAX_BYTES, rule.max_file_size_mb * 1024 * 1024)
  if (file.size > limitBytes) {
    return `${file.name} is ${formatFileSize(file.size)}, above the ${formatFileSize(limitBytes)} limit.`
  }
  return null
}

export function attachmentCountRejection(count: number): string | null {
  return count > COMPLAINT_ATTACHMENT_MAX_COUNT
    ? `Attach at most ${COMPLAINT_ATTACHMENT_MAX_COUNT} files.`
    : null
}

export function acceptedTypesAttribute(rules: FileTypeRule[]): string {
  return rules
    .filter((rule) => rule.file_type_accepted)
    .map((rule) => `.${rule.file_extension}`)
    .join(',')
}

export function acceptedTypesSummary(rules: FileTypeRule[]): string {
  const accepted = rules.filter((rule) => rule.file_type_accepted)
  if (accepted.length === 0) return 'No file types are currently accepted.'
  return accepted.map((rule) => `.${rule.file_extension}`).join(', ')
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}
