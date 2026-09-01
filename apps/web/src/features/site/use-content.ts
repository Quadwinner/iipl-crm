import { useQuery } from '@tanstack/react-query'
import {
  listBlogPosts,
  listIndustries,
  listPortfolio,
  listServices,
  SITE_STALE_TIME,
  siteKeys,
} from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export type { BlogPost, Industry, PortfolioItem, Service } from '@itoby/shared'

/** Published services, ordered as the CMS orders them. */
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

export function usePortfolio() {
  return useQuery({
    queryKey: siteKeys.portfolio,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listPortfolio(supabase()),
  })
}

export function useBlogPosts() {
  return useQuery({
    queryKey: siteKeys.posts,
    staleTime: SITE_STALE_TIME,
    queryFn: () => listBlogPosts(supabase()),
  })
}
