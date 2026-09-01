import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { ComplaintUpdatableStatus } from '../validation/complaint'
import type { ComplaintStatus, Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export type AdminComplaintRow =
  Database['public']['Functions']['list_all_complaints']['Returns'][number]

export interface ComplaintFilters {
  category: string | null
  status: ComplaintStatus | null
  officeOwnerId: Uuid | null
  /** Local calendar day, `YYYY-MM-DD`. */
  createdFrom: string | null
  createdTo: string | null
}

export const EMPTY_COMPLAINT_FILTERS: ComplaintFilters = {
  category: null,
  status: null,
  officeOwnerId: null,
  createdFrom: null,
  createdTo: null,
}

export const adminComplaintKeys = {
  all: ['complaints'] as const,
  categories: ['complaint-categories'] as const,
  staff: ['maintenance-staff'] as const,
  list: (filters: ComplaintFilters) =>
    [
      'complaints',
      'list',
      filters.category,
      filters.status,
      filters.officeOwnerId,
      filters.createdFrom,
      filters.createdTo,
    ] as const,
  events: (complaintId: Uuid) => ['complaints', 'events', complaintId] as const,
}

/** Calendar-day filters are inclusive, so the end bound covers the operator's whole local day. */
function dayStart(day: string | null): string | undefined {
  return day ? new Date(`${day}T00:00:00`).toISOString() : undefined
}

function dayEnd(day: string | null): string | undefined {
  return day ? new Date(`${day}T23:59:59.999`).toISOString() : undefined
}

export async function listAllComplaints(
  client: TypedSupabaseClient,
  filters: ComplaintFilters,
): Promise<AdminComplaintRow[]> {
  const { data, error } = await client.rpc('list_all_complaints', {
    p_category: filters.category ?? undefined,
    p_status: filters.status ?? undefined,
    p_office_owner_id: filters.officeOwnerId ?? undefined,
    p_created_from: dayStart(filters.createdFrom),
    p_created_to: dayEnd(filters.createdTo),
  })
  if (error) throw dbError(error, 'Complaints could not be loaded.')
  return data ?? []
}

export interface MaintenanceStaffOption {
  user_id: Uuid
  name: string
}

/**
 * `list_staff` is Administrator-only in the database, matching assignment being
 * Administrator-only. Deactivated staff are excluded: they are not valid assignees.
 */
export async function listMaintenanceStaff(
  client: TypedSupabaseClient,
): Promise<MaintenanceStaffOption[]> {
  const { data, error } = await client.rpc('list_staff', { p_include_inactive: false })
  if (error) throw dbError(error, 'Maintenance staff could not be loaded.')
  return (data ?? []).map((row) => ({ user_id: row.user_id, name: row.full_name ?? row.email }))
}

export async function assignComplaint(
  client: TypedSupabaseClient,
  input: { complaintId: Uuid; staffId: Uuid },
): Promise<void> {
  const { error } = await client.rpc('assign_complaint', {
    p_complaint_id: input.complaintId,
    p_staff_id: input.staffId,
  })
  if (error) throw dbError(error, 'The complaint could not be assigned.')
}

export async function updateComplaintStatus(
  client: TypedSupabaseClient,
  input: { complaintId: Uuid; status: ComplaintUpdatableStatus },
): Promise<void> {
  const { error } = await client.rpc('update_complaint_status', {
    p_complaint_id: input.complaintId,
    p_new_status: input.status,
  })
  if (error) throw dbError(error, 'The complaint status could not be updated.')
}

export async function addComplaintComment(
  client: TypedSupabaseClient,
  input: { complaintId: Uuid; comment: string },
): Promise<void> {
  const { error } = await client.rpc('add_comment', {
    p_complaint_id: input.complaintId,
    p_comment: input.comment,
  })
  if (error) throw dbError(error, 'The comment could not be added.')
}
