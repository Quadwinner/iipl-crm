import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { buildingKeys, listBuildings, type Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'
import { unitKeys } from '@rental-admin/features/units/api'

export { buildingKeys, type BuildingRow } from '@itoby/shared'

export interface BuildingInput {
  name: string
  address: string
}

export function useBuildingList() {
  return useQuery({
    queryKey: buildingKeys.list,
    queryFn: () => listBuildings(supabase()),
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
