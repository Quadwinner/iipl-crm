import {
  COMPLAINT_ATTACHMENT_MAX_BYTES,
  COMPLAINT_ATTACHMENT_MAX_COUNT,
  type ComplaintSubmissionInput,
} from '../validation/complaint'
import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { Uuid } from '../types/domain'
import { dbError } from './db-error'
import { EdgeFunctionError, invokeEdgeFunctionMultipart } from './edge-function'
import { formatFileSize } from './format'

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
export async function listOwnerComplaints(client: TypedSupabaseClient): Promise<ComplaintRow[]> {
  const { data, error } = await client.rpc('list_complaints_for_owner')
  if (error) throw dbError(error, 'Your complaints could not be loaded.')
  return data ?? []
}

/**
 * `get_complaint_history` returns the acting user's display name alongside each event;
 * `complaint_event` alone cannot, because owners cannot read staff `profiles` rows.
 */
export async function getComplaintHistory(
  client: TypedSupabaseClient,
  complaintId: Uuid,
): Promise<ComplaintEventRow[]> {
  const { data, error } = await client.rpc('get_complaint_history', {
    p_complaint_id: complaintId,
  })
  if (error) throw dbError(error, 'The status history could not be loaded.')
  return data ?? []
}

export async function listComplaintCategories(client: TypedSupabaseClient): Promise<string[]> {
  const { data, error } = await client
    .from('complaint_categories')
    .select('name')
    .eq('is_active', true)
    .order('name')
  if (error) throw dbError(error, 'Complaint categories could not be loaded.')
  return (data ?? []).map((row) => row.name)
}

/**
 * The owner's currently-allotted units, read through owner-scoped RLS on `allotment`.
 * `submit_complaint` re-checks the allotment server-side (Requirement 6.4).
 */
export async function listAllottedUnits(client: TypedSupabaseClient): Promise<AllottedUnit[]> {
  const { data, error } = await client
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
}

export async function listFileTypeRules(client: TypedSupabaseClient): Promise<FileTypeRule[]> {
  const { data, error } = await client
    .from('file_storage_config')
    .select('file_extension, file_type_accepted, max_file_size_mb')
    .order('file_extension')
  if (error) throw dbError(error, 'Accepted file types could not be loaded.')
  return data ?? []
}

/**
 * One attachment, described in the terms both platforms can supply.
 *
 * `part` is whatever that platform appends to a FormData: a browser `File`, or
 * React Native's `{ uri, name, type }`. It stays `unknown` here because the two
 * have no common type, and the single cast at the append site is the honest
 * place for that difference to live.
 */
export interface ComplaintAttachment {
  name: string
  size: number
  part: unknown
}

export interface SubmitComplaintInput extends ComplaintSubmissionInput {
  attachments: ComplaintAttachment[]
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
export async function submitComplaint(
  client: TypedSupabaseClient,
  input: SubmitComplaintInput,
): Promise<SubmitComplaintResult> {
  const { data, error } = await client.rpc('submit_complaint', {
    p_office_unit_id: input.office_unit_id,
    p_category: input.category,
    p_description: input.description,
  })
  if (error) throw dbError(error, 'Your complaint could not be submitted.')

  const complaintId = (data as { id: Uuid }).id
  const attachmentErrors: string[] = []

  for (const attachment of input.attachments) {
    const form = new FormData()
    form.append('complaint_id', complaintId)
    form.append('file', attachment.part as Blob)
    try {
      await invokeEdgeFunctionMultipart<AttachmentResponse>(client, 'upload-attachment', form)
    } catch (cause) {
      attachmentErrors.push(
        `${attachment.name}: ${cause instanceof EdgeFunctionError || cause instanceof Error ? cause.message : String(cause)}`,
      )
    }
  }

  return { complaintId, attachmentErrors }
}

/** The parts of a file the pre-upload checks need; both platforms' pickers supply these. */
export interface AttachmentCandidate {
  name: string
  size: number
}

/**
 * Client-side mirror of the Edge Function's checks so the owner is told before uploading;
 * the server stays the enforcement point (Requirements 6.1, 6.5).
 */
export function attachmentRejection(
  file: AttachmentCandidate,
  rules: FileTypeRule[],
): string | null {
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
