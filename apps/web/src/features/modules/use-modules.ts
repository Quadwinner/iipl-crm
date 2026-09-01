import { useQuery } from '@tanstack/react-query'
import { listMyModules, listPublicModules, SITE_STALE_TIME, siteKeys } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export type { AppModule } from '@itoby/shared'

/**
 * The launcher's module list. Reads through modules_for_current_user(), which
 * filters by public.current_role() server-side — this never queries app_modules
 * directly and never re-filters by role here.
 */
export function useMyModules() {
  return useQuery({
    queryKey: siteKeys.myModules,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listMyModules(supabase()),
  })
}

/** The public product catalogue: publicly listed rows, readable by anon. */
export function usePublicModules() {
  return useQuery({
    queryKey: siteKeys.publicModules,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listPublicModules(supabase()),
  })
}
