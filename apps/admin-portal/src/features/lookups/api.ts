import { useQuery } from '@tanstack/react-query'
import type { Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export interface OwnerOption {
  id: Uuid
  name: string
}

export const lookupKeys = {
  owners: ['lookups', 'owners'] as const,
}

export function useOwnerOptions() {
  return useQuery({
    queryKey: lookupKeys.owners,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<OwnerOption[]> => {
      const { data, error } = await supabase()
        .from('office_owners')
        .select('id, name')
        .order('name')
      if (error) throw dbError(error, 'Office owners could not be loaded.')
      return data ?? []
    },
  })
}
