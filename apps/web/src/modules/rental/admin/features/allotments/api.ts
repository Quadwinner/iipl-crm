import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  allotmentKeys,
  listAllotments,
  listVacantUnits,
  type AllotmentCreateInput,
  type AllotmentFilters,
  type Database,
  type OwnerStatus,
  type TerminalAllotmentStatus,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

export type AllotmentHistoryRow =
  Database['public']['Functions']['get_allotment_history']['Returns'][number]

export {
  allotmentKeys,
  type AllotmentFilters,
  type AllotmentListRow,
  type VacantUnitOption,
} from '@itoby/shared'

export interface OwnerOption {
  id: Uuid
  name: string
  contact_email: string
  status: OwnerStatus
}

export function useAllotments(filters: AllotmentFilters) {
  return useQuery({
    queryKey: allotmentKeys.list(filters),
    queryFn: () => listAllotments(supabase(), filters),
  })
}

/** Only vacant units can be allotted (Requirements 2.4, 3.1); the RPC re-checks server-side. */
export function useVacantUnits() {
  return useQuery({
    queryKey: allotmentKeys.vacantUnits,
    queryFn: () => listVacantUnits(supabase()),
  })
}

export function useAllotmentHistory(unitId: Uuid | null) {
  return useQuery({
    queryKey: allotmentKeys.history(unitId),
    enabled: unitId !== null,
    queryFn: async (): Promise<AllotmentHistoryRow[]> => {
      const { data, error } = await supabase().rpc('get_allotment_history', {
        p_office_unit_id: unitId!,
      })
      if (error) throw dbError(error, 'Allotment history could not be loaded.')
      return data ?? []
    },
  })
}

export function useCreateAllotment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: AllotmentCreateInput) => {
      const { data, error } = await supabase().rpc('create_allotment', {
        p_office_unit_id: input.office_unit_id,
        p_office_owner_id: input.office_owner_id,
        p_lease_start: input.lease_start,
        p_lease_end: input.lease_end,
        p_rent_amount: input.rent_amount,
        p_billing_cycle: input.billing_cycle,
      })
      if (error) throw dbError(error, 'The allotment could not be created.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allotmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export interface TransitionAllotmentInput {
  allotmentId: Uuid
  targetStatus: TerminalAllotmentStatus
  reason?: string
}

export function useTransitionAllotment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ allotmentId, targetStatus, reason }: TransitionAllotmentInput) => {
      const { data, error } = await supabase().rpc('transition_allotment', {
        p_allotment_id: allotmentId,
        p_target_status: targetStatus,
        p_reason: reason,
      })
      if (error) throw dbError(error, 'The allotment could not be updated.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allotmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['units'] })
    },
  })
}

export function useUpdateLeaseRent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { allotmentId: Uuid; rentAmount: number }) => {
      const { data, error } = await supabase().rpc('update_lease_rent', {
        p_allotment_id: input.allotmentId,
        p_rent_amount: input.rentAmount,
      })
      if (error) throw dbError(error, 'The lease rent could not be updated.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: allotmentKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['units'] })
      void queryClient.invalidateQueries({ queryKey: ['tenants'] })
      void queryClient.invalidateQueries({ queryKey: ['billing'] })
    },
  })
}
