import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database, OccupancyStatus, OfficeUnitInput, Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

export type UnitRow = Database['public']['Functions']['list_office_units']['Returns'][number]

export interface BuildingOption {
  id: Uuid
  name: string
}

export interface UnitFilters {
  buildingId: Uuid | null
  occupancyStatus: OccupancyStatus | null
}

export interface OccupancySummary {
  occupiedCount: number
  vacantCount: number
  totalCount: number
}

export const unitKeys = {
  all: ['units'] as const,
  buildings: ['buildings'] as const,
  list: (filters: UnitFilters) =>
    ['units', 'list', filters.buildingId, filters.occupancyStatus] as const,
  occupancy: (buildingId: Uuid | null) => ['units', 'occupancy', buildingId] as const,
}

export function useBuildings() {
  return useQuery({
    queryKey: unitKeys.buildings,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<BuildingOption[]> => {
      const { data, error } = await supabase().from('building').select('id, name').order('name')
      if (error) throw dbError(error, 'Buildings could not be loaded.')
      return data
    },
  })
}

export function useUnits(filters: UnitFilters) {
  return useQuery({
    queryKey: unitKeys.list(filters),
    queryFn: async (): Promise<UnitRow[]> => {
      const { data, error } = await supabase().rpc('list_office_units', {
        p_building_id: filters.buildingId ?? undefined,
        p_occupancy_status: filters.occupancyStatus ?? undefined,
      })
      if (error) throw dbError(error, 'Office units could not be loaded.')
      return data ?? []
    },
  })
}

export function useOccupancySummary(buildingId: Uuid | null) {
  return useQuery({
    queryKey: unitKeys.occupancy(buildingId),
    queryFn: async (): Promise<OccupancySummary> => {
      const { data, error } = await supabase().rpc('occupancy_summary', {
        p_building_id: buildingId ?? undefined,
      })
      if (error) throw dbError(error, 'Occupancy counts could not be loaded.')

      const row = data?.[0]
      return {
        occupiedCount: row?.occupied_count ?? 0,
        vacantCount: row?.vacant_count ?? 0,
        totalCount: row?.total_count ?? 0,
      }
    },
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: OfficeUnitInput) => {
      const { data, error } = await supabase().rpc('create_office_unit', {
        p_building_id: input.building_id,
        p_unit_code: input.unit_code,
        p_floor: input.floor,
        p_size_sqft: input.size_sqft,
        p_base_rent_amount: input.base_rent_amount,
      })
      if (error) throw dbError(error, 'The office unit could not be created.')
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
  })
}

/** Occupancy_Status is not an argument of `update_office_unit`, so an edit cannot change it. */
export function useUpdateUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: OfficeUnitInput & { id: Uuid }) => {
      const { data, error } = await supabase().rpc('update_office_unit', {
        p_unit_id: id,
        p_building_id: input.building_id,
        p_unit_code: input.unit_code,
        p_floor: input.floor,
        p_size_sqft: input.size_sqft,
        p_base_rent_amount: input.base_rent_amount,
      })
      if (error) throw dbError(error, 'The office unit could not be updated.')
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: unitKeys.all }),
  })
}
