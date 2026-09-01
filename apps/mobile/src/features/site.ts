import { useMutation, useQuery } from '@tanstack/react-query'
import {
  getSiteSettings,
  listIndustries,
  listMyModules,
  listPublicModules,
  listServices,
  siteKeys,
  SITE_STALE_TIME,
  submitLead,
  type LeadInput,
} from '@itoby/shared/site'
import { supabase } from '../lib/supabase'

/**
 * Every hook here wraps a query function from @itoby/shared/site — the same one
 * the web superapp calls. The site is CMS-driven, so a change in the admin
 * content editor shows up in the app without a release.
 */

export function useSiteSettings() {
  return useQuery({
    queryKey: siteKeys.settings,
    staleTime: SITE_STALE_TIME,
    queryFn: () => getSiteSettings(supabase()),
  })
}

export function useServices() {
  return useQuery({
    queryKey: siteKeys.services,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listServices(supabase()),
  })
}

export function useIndustries() {
  return useQuery({
    queryKey: siteKeys.industries,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listIndustries(supabase()),
  })
}

/** The public product catalogue — readable signed out. */
export function usePublicModules() {
  return useQuery({
    queryKey: siteKeys.publicModules,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listPublicModules(supabase()),
  })
}

/** The launcher's list. Filtered by role server-side in modules_for_current_user(). */
export function useMyModules() {
  return useQuery({
    queryKey: siteKeys.myModules,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listMyModules(supabase()),
  })
}

export function useSubmitLead() {
  return useMutation({
    mutationFn: (input: LeadInput) => submitLead(supabase(), input),
  })
}
