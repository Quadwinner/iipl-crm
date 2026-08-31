import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

type Tables = Database['public']['Tables']
export type SiteSettings = Tables['site_settings']['Row']
export type ServiceOffering = Tables['service_offerings']['Row']
export type Industry = Tables['industries']['Row']

/**
 * Writes below are plain table updates, not RPCs: they are single-row,
 * single-table changes with no second write to keep atomic. Authorization is
 * still doubled — the *_write_admin RLS policies require is_administrator(),
 * and the UI is only reachable behind the CONTENT_MANAGE permission.
 */
export function useUpdateSiteSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<SiteSettings>) => {
      const { data, error } = await supabase()
        .from('site_settings')
        .update(patch)
        .eq('id', 1)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-settings'] })
      qc.invalidateQueries({ queryKey: ['cms-settings'] })
    },
  })
}

export function useCmsSettings() {
  return useQuery({
    queryKey: ['cms-settings'],
    queryFn: async (): Promise<SiteSettings | null> => {
      const { data, error } = await supabase().from('site_settings').select('*').eq('id', 1).maybeSingle()
      if (error) throw new Error(error.message)
      return data
    },
  })
}

export function useCmsServices() {
  return useQuery({
    queryKey: ['cms-services'],
    queryFn: async (): Promise<ServiceOffering[]> => {
      const { data, error } = await supabase().from('service_offerings').select('*').order('sort_order')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export function useCmsIndustries() {
  return useQuery({
    queryKey: ['cms-industries'],
    queryFn: async (): Promise<Industry[]> => {
      const { data, error } = await supabase().from('industries').select('*').order('sort_order')
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

export function useTogglePublished(table: 'service_offerings' | 'industries') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: string; is_published: boolean }) => {
      const { error } = await supabase()
        .from(table)
        .update({ is_published: vars.is_published })
        .eq('id', vars.id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-services'] })
      qc.invalidateQueries({ queryKey: ['cms-industries'] })
    },
  })
}
