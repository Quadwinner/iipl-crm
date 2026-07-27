import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AllotmentCreateInput,
  AllotmentStatus,
  BillingCycle,
  Database,
  OwnerStatus,
  TerminalAllotmentStatus,
  Uuid,
} from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export type AllotmentHistoryRow =
  Database['public']['Functions']['get_allotment_history']['Returns'][number]

export interface AllotmentListRow {
  id: Uuid
  status: AllotmentStatus
  created_at: string
  terminated_at: string | null
  expiration_reason: string | null
  office_unit_id: Uuid
  unit_code: string
  building_name: string
  office_owner_id: Uuid
  owner_name: string
  owner_email: string
  lease_start: string | null
  lease_end: string | null
  rent_amount: number | null
  billing_cycle: BillingCycle | null
}

export interface AllotmentFilters {
  status: AllotmentStatus | null
  ownerId: Uuid | null
}

export interface OwnerOption {
  id: Uuid
  name: string
  contact_email: string
  status: OwnerStatus
}

export interface VacantUnitOption {
  id: Uuid
  unit_code: string
  building_name: string
  base_rent_amount: number
}

export const allotmentKeys = {
  all: ['allotments'] as const,
  list: (filters: AllotmentFilters) =>
    ['allotments', 'list', filters.status, filters.ownerId] as const,
  history: (unitId: Uuid | null) => ['allotments', 'history', unitId] as const,
  vacantUnits: ['allotments', 'vacant-units'] as const,
}

const LIST_SELECT =
  'id, status, created_at, terminated_at, expiration_reason, office_unit_id, office_owner_id, office_unit(unit_code, building(name)), office_owners(name, contact_email), lease(start_date, end_date, rent_amount, billing_cycle)'

export function useAllotments(filters: AllotmentFilters) {
  return useQuery({
    queryKey: allotmentKeys.list(filters),
    queryFn: async (): Promise<AllotmentListRow[]> => {
      let query = supabase()
        .from('allotment')
        .select(LIST_SELECT)
        .order('created_at', { ascending: false })

      if (filters.status !== null) query = query.eq('status', filters.status)
      if (filters.ownerId !== null) query = query.eq('office_owner_id', filters.ownerId)

      const { data, error } = await query
      if (error) throw dbError(error, 'Allotments could not be loaded.')

      return (data ?? []).map((row) => ({
        id: row.id,
        status: row.status,
        created_at: row.created_at,
        terminated_at: row.terminated_at,
        expiration_reason: row.expiration_reason,
        office_unit_id: row.office_unit_id,
        unit_code: row.office_unit?.unit_code ?? '—',
        building_name: row.office_unit?.building?.name ?? '—',
        office_owner_id: row.office_owner_id,
        owner_name: row.office_owners?.name ?? '—',
        owner_email: row.office_owners?.contact_email ?? '—',
        lease_start: row.lease?.start_date ?? null,
        lease_end: row.lease?.end_date ?? null,
        rent_amount: row.lease?.rent_amount ?? null,
        billing_cycle: row.lease?.billing_cycle ?? null,
      }))
    },
  })
}

/** Only vacant units can be allotted (Requirements 2.4, 3.1); the RPC re-checks server-side. */
export function useVacantUnits() {
  return useQuery({
    queryKey: allotmentKeys.vacantUnits,
    queryFn: async (): Promise<VacantUnitOption[]> => {
      const { data, error } = await supabase().rpc('list_office_units', {
        p_occupancy_status: 'VACANT',
      })
      if (error) throw dbError(error, 'Vacant units could not be loaded.')

      return (data ?? []).map((unit) => ({
        id: unit.id,
        unit_code: unit.unit_code,
        building_name: unit.building_name,
        base_rent_amount: unit.base_rent_amount,
      }))
    },
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
