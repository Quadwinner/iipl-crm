import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * The singleton site_settings row. Every piece of company copy — name, tagline,
 * intro, contact details, socials — comes from here so the site can be edited
 * from the CMS without a redeploy. Nothing is hardcoded in components.
 *
 * Readable by anon under RLS, so this works on the public site too.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase()
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data
    },
  })
}
