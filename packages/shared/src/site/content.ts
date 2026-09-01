import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'

type Tables = Database['public']['Tables']
export type SiteSettings = Tables['site_settings']['Row']
export type Service = Tables['service_offerings']['Row']
export type Industry = Tables['industries']['Row']
export type PortfolioItem = Tables['portfolio_items']['Row']
export type BlogPost = Tables['blog_posts']['Row']
export type AppModule = Tables['app_modules']['Row']

export const siteKeys = {
  settings: ['site-settings'] as const,
  services: ['services'] as const,
  industries: ['industries'] as const,
  portfolio: ['portfolio'] as const,
  posts: ['blog-posts'] as const,
  publicModules: ['public-modules'] as const,
  myModules: ['my-modules'] as const,
}

/** Everything on the public site is CMS-driven, so it is all cached the same way. */
export const SITE_STALE_TIME = 5 * 60_000

function fail(message: string, error: { message?: string } | null): never {
  throw new Error(error?.message ?? message)
}

/**
 * The singleton site_settings row. Every piece of company copy — name, tagline,
 * intro, contact details, socials, stats, process — comes from here so the site
 * can be edited from the CMS without a redeploy. Readable by anon under RLS.
 */
export async function getSiteSettings(client: TypedSupabaseClient): Promise<SiteSettings | null> {
  const { data, error } = await client.from('site_settings').select('*').eq('id', 1).maybeSingle()
  if (error) fail('Site settings could not be loaded.', error)
  return data
}

/** Published services, ordered as the CMS orders them. */
export async function listServices(client: TypedSupabaseClient): Promise<Service[]> {
  const { data, error } = await client
    .from('service_offerings')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  if (error) fail('Services could not be loaded.', error)
  return data ?? []
}

export async function listIndustries(client: TypedSupabaseClient): Promise<Industry[]> {
  const { data, error } = await client
    .from('industries')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  if (error) fail('Industries could not be loaded.', error)
  return data ?? []
}

export async function listPortfolio(client: TypedSupabaseClient): Promise<PortfolioItem[]> {
  const { data, error } = await client
    .from('portfolio_items')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
  if (error) fail('Case studies could not be loaded.', error)
  return data ?? []
}

export async function listBlogPosts(client: TypedSupabaseClient): Promise<BlogPost[]> {
  const { data, error } = await client
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
  if (error) fail('Posts could not be loaded.', error)
  return data ?? []
}

/**
 * The launcher's module list. Reads through modules_for_current_user(), which
 * filters by public.current_role() server-side — this never queries app_modules
 * directly and never re-filters by role on the client.
 */
export async function listMyModules(client: TypedSupabaseClient): Promise<AppModule[]> {
  const { data, error } = await client.rpc('modules_for_current_user')
  if (error) fail('Your apps could not be loaded.', error)
  return data ?? []
}

/** The public product catalogue: publicly listed rows, readable by anon. */
export async function listPublicModules(client: TypedSupabaseClient): Promise<AppModule[]> {
  const { data, error } = await client
    .from('app_modules')
    .select('*')
    .eq('listed_publicly', true)
    .order('sort_order')
  if (error) fail('Products could not be loaded.', error)
  return data ?? []
}

/**
 * Home page figures and process steps. Both are jsonb on site_settings, edited
 * through the CMS, so their shapes are what the site renders — not what the
 * database guarantees.
 */
export interface SiteStat {
  value: string
  /** Rendered tight against `value`: the "+" in "1,200+", the "%" in "99%". */
  suffix: string
  label: string
}

export interface ProcessStep {
  /** The CMS-supplied number, e.g. "01". Not derived from array position. */
  step: string
  title: string
  body: string
}

/**
 * `stats` and `process` are jsonb columns the CMS writes, so their shape is not
 * guaranteed by the database. Both readers drop anything that does not carry the
 * fields they need rather than rendering `undefined` into the page.
 */
function readShaped<T>(raw: unknown, fields: (keyof T & string)[]): T[] {
  if (!Array.isArray(raw)) return []
  const out: T[] = []
  for (const row of raw) {
    if (typeof row !== 'object' || row === null) continue
    const record = row as Record<string, unknown>
    if (fields.every((field) => typeof record[field] === 'string')) out.push(row as T)
  }
  return out
}

export function readStats(settings: SiteSettings | null | undefined): SiteStat[] {
  return readShaped<SiteStat>(settings?.stats, ['value', 'label'])
}

export function readProcess(settings: SiteSettings | null | undefined): ProcessStep[] {
  return readShaped<ProcessStep>(settings?.process, ['title', 'body'])
}

/** The words the hero cycles through. Fixed copy, matching the website's. */
export const HERO_ROTATING = ['Websites', 'Apps', 'SaaS', 'AI Agents'] as const

export const HERO_EYEBROW = 'Global digital engineering & SaaS lab'
