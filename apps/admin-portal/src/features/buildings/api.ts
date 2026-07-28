import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'
import { unitKeys } from '@/features/units/api'

export interface BuildingRow {
  id: Uuid
  name: string
  address: string
  created_at: string
  updated_at: string
  unit_count: number
}

export interface BuildingInput {
  name: string
  address: string
}

export const buildingKeys = {
  all: ['buildings', 'full'] as const,
  list: ['buildings', 'full', 'list'] as const,
}

export function useBuildingList() {
  return useQuery({
    queryKey: buildingKeys.list,
    queryFn: async (): Promise<BuildingRow[]> => {
      const [{ data: buildings, error: buildingsError }, { data: units, error: unitsError }] =
        await Promise.all([
          supabase()
            .from('building')
            .select('id, name, address, created_at, updated_at')
            .order('name'),
          supabase().from('office_unit').select('building_id'),
        ])

      if (buildingsError) throw dbError(buildingsError, 'Buildings could not be loaded.')
      if (unitsError) throw dbError(unitsError, 'Unit counts could not be loaded.')

      const counts = new Map<string, number>()
      for (const unit of units ?? []) {
        counts.set(unit.building_id, (counts.get(unit.building_id) ?? 0) + 1)
      }

      return (buildings ?? []).map((building) => ({
        ...building,
        unit_count: counts.get(building.id) ?? 0,
      }))
    },
  })
}

export function useCreateBuilding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: BuildingInput) => {
      const { data, error } = await supabase()
        .from('building')
        .insert({ name: input.name.trim(), address: input.address.trim() })
        .select('id, name, address, created_at, updated_at')
        .single()
      if (error) throw dbError(error, 'The building could not be created.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buildingKeys.all })
      void queryClient.invalidateQueries({ queryKey: unitKeys.buildings })
    },
  })
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...input }: BuildingInput & { id: Uuid }) => {
      const { data, error } = await supabase()
        .from('building')
        .update({ name: input.name.trim(), address: input.address.trim() })
        .eq('id', id)
        .select('id, name, address, created_at, updated_at')
        .single()
      if (error) throw dbError(error, 'The building could not be updated.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: buildingKeys.all })
      void queryClient.invalidateQueries({ queryKey: unitKeys.buildings })
    },
  })
}
