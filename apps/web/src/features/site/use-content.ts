import { useQuery } from '@tanstack/react-query'
import type { Database } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

type T = Database['public']['Tables']
export type Service = T['service_offerings']['Row']
export type Industry = T['industries']['Row']

/** Published services, ordered as the CMS orders them. */
export function useServices() {
  return useQuery({
    queryKey: ['services'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase()
        .from('service_offerings')
        .select('*')
        .eq('is_published', true)
        .order('sort_order')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export function useIndustries() {
  return useQuery({
    queryKey: ['industries'],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Industry[]> => {
      const { data, error } = await supabase()
        .from('industries')
        .select('*')
        .eq('is_published', true)
        .order('sort_order')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}
