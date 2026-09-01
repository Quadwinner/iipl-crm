import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addComplaintComment,
  adminComplaintKeys,
  assignComplaint,
  buildingKeys,
  EMPTY_COMPLAINT_FILTERS,
  getOccupancySummary,
  listAllComplaints,
  listBuildings,
  listMaintenanceStaff,
  listOwners,
  listStaff,
  listUnits,
  ownerKeys,
  staffKeys,
  unitKeys,
  updateComplaintStatus,
  type ComplaintFilters,
} from '@itoby/shared/admin'
import { getComplaintHistory } from '@itoby/shared/owner'
import type { ComplaintUpdatableStatus } from '@itoby/shared/validation'
import type { Uuid } from '@itoby/shared/types'
import { supabase } from '../../../lib/supabase'

/**
 * Staff-facing hooks, wrapping the same query functions the admin portal uses.
 * Nothing here decides what a user may see: every call is gated by RLS and, for
 * the RPCs, by require_permission() inside the function.
 */

export function useBuildings() {
  return useQuery({ queryKey: buildingKeys.list, queryFn: () => listBuildings(supabase()) })
}

export function useUnits(buildingId: Uuid | null) {
  const filters = { buildingId, occupancyStatus: null }
  return useQuery({ queryKey: unitKeys.list(filters), queryFn: () => listUnits(supabase(), filters) })
}

export function useOccupancy(buildingId: Uuid | null) {
  return useQuery({
    queryKey: unitKeys.occupancy(buildingId),
    queryFn: () => getOccupancySummary(supabase(), buildingId),
  })
}

export function useOwners() {
  const filters = { status: null }
  return useQuery({ queryKey: ownerKeys.list(filters), queryFn: () => listOwners(supabase(), filters) })
}

export function useStaff() {
  return useQuery({ queryKey: staffKeys.list(true), queryFn: () => listStaff(supabase(), true) })
}

export function useAdminComplaints(filters: ComplaintFilters = EMPTY_COMPLAINT_FILTERS) {
  return useQuery({
    queryKey: adminComplaintKeys.list(filters),
    queryFn: () => listAllComplaints(supabase(), filters),
  })
}

export function useAdminComplaintHistory(complaintId: Uuid | null) {
  return useQuery({
    queryKey: adminComplaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: () => getComplaintHistory(supabase(), complaintId as Uuid),
  })
}

export function useMaintenanceStaff() {
  return useQuery({
    queryKey: adminComplaintKeys.staff,
    staleTime: 5 * 60_000,
    queryFn: () => listMaintenanceStaff(supabase()),
  })
}

function useComplaintMutation<TInput>(run: (input: TInput) => Promise<void>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminComplaintKeys.all }),
  })
}

export function useAssignComplaint() {
  return useComplaintMutation((input: { complaintId: Uuid; staffId: Uuid }) =>
    assignComplaint(supabase(), input),
  )
}

export function useUpdateComplaintStatus() {
  return useComplaintMutation((input: { complaintId: Uuid; status: ComplaintUpdatableStatus }) =>
    updateComplaintStatus(supabase(), input),
  )
}

export function useAddComplaintComment() {
  return useComplaintMutation((input: { complaintId: Uuid; comment: string }) =>
    addComplaintComment(supabase(), input),
  )
}
