import { getSupabaseClient, type TypedSupabaseClient } from '@itoby/shared'

/**
 * The superapp's single Supabase client, built from VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY (repo-root .env, see vite envDir). Every module —
 * including the mounted rental trees — resolves to this one instance, so there
 * is exactly one auth session and one refresh loop per page load.
 */
export function supabase(): TypedSupabaseClient {
  return getSupabaseClient(import.meta.env)
}
