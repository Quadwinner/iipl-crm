import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOccupancySummary,
  listBuildingOptions,
  listUnits,
  unitKeys,
  type OfficeUnitInput,
  type UnitFilters,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

export {
  unitKeys,
  type BuildingOption,
  type OccupancySummary,
  type UnitFilters,
  type UnitRow,
} from '@itoby/shared'

export function useBuildings() {
  return useQuery({
    queryKey: unitKeys.buildings,
    staleTime: 5 * 60_000,
    queryFn: () => listBuildingOptions(supabase()),
  })
}

export function useUnits(filters: UnitFilters) {
  return useQuery({
    queryKey: unitKeys.list(filters),
    queryFn: () => listUnits(supabase(), filters),
  })
}

export function useOccupancySummary(buildingId: Uuid | null) {
  return useQuery({
    queryKey: unitKeys.occupancy(buildingId),
    queryFn: () => getOccupancySummary(supabase(), buildingId),
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
