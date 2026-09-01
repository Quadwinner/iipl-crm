import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addComplaintComment,
  adminComplaintKeys as complaintKeys,
  assignComplaint,
  getComplaintHistory,
  listAllComplaints,
  listComplaintCategories,
  listMaintenanceStaff,
  updateComplaintStatus,
  type ComplaintFilters,
  type ComplaintUpdatableStatus,
  type Uuid,
} from '@itoby/shared'
import { supabase } from '@rental-admin/lib/supabase'

export {
  adminComplaintKeys as complaintKeys,
  EMPTY_COMPLAINT_FILTERS,
  type AdminComplaintRow as ComplaintRow,
  type ComplaintFilters,
  type MaintenanceStaffOption,
} from '@itoby/shared'
export type { ComplaintEventRow } from '@itoby/shared'

export function useComplaints(filters: ComplaintFilters) {
  return useQuery({
    queryKey: complaintKeys.list(filters),
    queryFn: () => listAllComplaints(supabase(), filters),
  })
}

export function useComplaintCategories() {
  return useQuery({
    queryKey: complaintKeys.categories,
    staleTime: 5 * 60_000,
    queryFn: () => listComplaintCategories(supabase()),
  })
}

/**
 * `list_staff` is Administrator-only in the database, matching assignment being
 * Administrator-only. Deactivated staff are excluded: they are not valid assignees.
 */
export function useMaintenanceStaff(enabled = true) {
  return useQuery({
    queryKey: complaintKeys.staff,
    enabled,
    staleTime: 5 * 60_000,
    queryFn: () => listMaintenanceStaff(supabase()),
  })
}

/** `get_complaint_history` carries the acting user's display name, so no uuid is rendered. */
export function useComplaintEvents(complaintId: Uuid | null) {
  return useQuery({
    queryKey: complaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: () => getComplaintHistory(supabase(), complaintId as Uuid),
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
  return useComplaintMutation((input: { complaintId: Uuid; staffId: Uuid }) =>
    assignComplaint(supabase(), input),
  )
}

export function useUpdateComplaintStatus() {
  return useComplaintMutation(
    (input: { complaintId: Uuid; status: ComplaintUpdatableStatus }) =>
      updateComplaintStatus(supabase(), input),
  )
}

export function useAddComplaintComment() {
  return useComplaintMutation((input: { complaintId: Uuid; comment: string }) =>
    addComplaintComment(supabase(), input),
  )
}
