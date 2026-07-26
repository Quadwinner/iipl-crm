import { getSupabaseClient, type TypedSupabaseClient } from '@itoby/shared'

/**
 * Lazily-created Supabase client for the Admin_Portal, built from
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (repo-root .env, see vite envDir).
 * Lazy so a missing .env fails at first use with a clear message rather than at
 * module-load time.
 */
export function supabase(): TypedSupabaseClient {
  return getSupabaseClient(import.meta.env)
}
