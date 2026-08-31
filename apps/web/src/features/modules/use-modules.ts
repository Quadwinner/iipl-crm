import { useQuery } from '@tanstack/react-query'
import type { Database } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export type AppModule = Database['public']['Tables']['app_modules']['Row']

/**
 * The launcher's module list. Reads through modules_for_current_user(), which
 * filters by public.current_role() server-side — this never queries app_modules
 * directly and never re-filters by role here.
 */
export function useMyModules() {
  return useQuery({
    queryKey: ['my-modules'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppModule[]> => {
      const { data, error } = await supabase().rpc('modules_for_current_user')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

/** The public product catalogue: publicly listed rows, readable by anon. */
export function usePublicModules() {
  return useQuery({
    queryKey: ['public-modules'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AppModule[]> => {
      const { data, error } = await supabase()
        .from('app_modules')
        .select('*')
        .eq('listed_publicly', true)
        .order('sort_order')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}
