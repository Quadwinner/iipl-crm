import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ComplaintStatus, ComplaintUpdatableStatus, Database, Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export type ComplaintRow = Database['public']['Functions']['list_all_complaints']['Returns'][number]
export type ComplaintEventRow =
  Database['public']['Functions']['get_complaint_history']['Returns'][number]

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

export const complaintKeys = {
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

export function useComplaints(filters: ComplaintFilters) {
  return useQuery({
    queryKey: complaintKeys.list(filters),
    queryFn: async (): Promise<ComplaintRow[]> => {
      const { data, error } = await supabase().rpc('list_all_complaints', {
        p_category: filters.category ?? undefined,
        p_status: filters.status ?? undefined,
        p_office_owner_id: filters.officeOwnerId ?? undefined,
        p_created_from: dayStart(filters.createdFrom),
        p_created_to: dayEnd(filters.createdTo),
      })
      if (error) throw dbError(error, 'Complaints could not be loaded.')
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

export interface MaintenanceStaffOption {
  user_id: Uuid
  name: string
}

/**
 * `list_staff` is Administrator-only in the database, which matches assignment being
 * Administrator-only. Deactivated staff are excluded because they are not valid assignees.
 */
export function useMaintenanceStaff(enabled = true) {
  return useQuery({
    queryKey: complaintKeys.staff,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MaintenanceStaffOption[]> => {
      const { data, error } = await supabase().rpc('list_staff', { p_include_inactive: false })
      if (error) throw dbError(error, 'Maintenance staff could not be loaded.')
      return (data ?? []).map((row) => ({
        user_id: row.user_id,
        name: row.full_name ?? row.email,
      }))
    },
  })
}

/** `get_complaint_history` carries the acting user's display name, so no uuid is rendered. */
export function useComplaintEvents(complaintId: Uuid | null) {
  return useQuery({
    queryKey: complaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: async (): Promise<ComplaintEventRow[]> => {
      const { data, error } = await supabase().rpc('get_complaint_history', {
        p_complaint_id: complaintId as Uuid,
      })
      if (error) throw dbError(error, 'Complaint history could not be loaded.')
      return data ?? []
    },
  })
}

function useComplaintMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}

export function useAssignComplaint() {
  return useComplaintMutation(
    async ({ complaintId, staffId }: { complaintId: Uuid; staffId: Uuid }) => {
      const { data, error } = await supabase().rpc('assign_complaint', {
        p_complaint_id: complaintId,
        p_staff_id: staffId,
      })
      if (error) throw dbError(error, 'The complaint could not be assigned.')
      return data
    },
  )
}

export function useUpdateComplaintStatus() {
  return useComplaintMutation(
    async ({ complaintId, status }: { complaintId: Uuid; status: ComplaintUpdatableStatus }) => {
      const { data, error } = await supabase().rpc('update_complaint_status', {
        p_complaint_id: complaintId,
        p_new_status: status,
      })
      if (error) throw dbError(error, 'The complaint status could not be updated.')
      return data
    },
  )
}

export function useAddComplaintComment() {
  return useComplaintMutation(
    async ({ complaintId, comment }: { complaintId: Uuid; comment: string }) => {
      const { data, error } = await supabase().rpc('add_comment', {
        p_complaint_id: complaintId,
        p_comment: comment,
      })
      if (error) throw dbError(error, 'The comment could not be added.')
      return data
    },
  )
}
