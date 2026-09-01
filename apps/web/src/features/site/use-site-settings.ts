import { useQuery } from '@tanstack/react-query'
import { getSiteSettings, SITE_STALE_TIME, siteKeys } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export type { SiteSettings } from '@itoby/shared'

/**
 * The singleton site_settings row — company copy, contact details, socials,
 * stats and process steps — so the site can be edited from the CMS without a
 * redeploy. The query lives in @itoby/shared so the Expo app reads the same row
 * the same way.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: siteKeys.settings,
    staleTime: SITE_STALE_TIME,
    queryFn: () => getSiteSettings(supabase()),
  })
}
