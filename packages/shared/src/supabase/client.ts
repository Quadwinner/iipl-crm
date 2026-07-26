import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

/** Supabase client typed against the generated `public` schema. */
export type TypedSupabaseClient = SupabaseClient<Database, 'public'>

export interface SupabaseConfig {
  url: string
  anonKey: string
}

/**
 * Env shape both portals expose through `import.meta.env`. The index signature
 * keeps it structurally compatible with Vite's `ImportMetaEnv`.
 */
export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
  [key: string]: unknown
}

export class MissingSupabaseConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing Supabase configuration: ${missing.join(', ')}. ` +
        'Copy .env.example to .env at the repo root and fill in the values from ' +
        'Supabase Dashboard > Project Settings > API.',
    )
    this.name = 'MissingSupabaseConfigError'
  }
}

/**
 * Reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` out of a Vite-style env
 * object and fails loudly (rather than constructing a half-configured client)
 * when either is absent.
 */
export function readSupabaseEnv(env: SupabaseEnv): SupabaseConfig {
  const url = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()

  const missing: string[] = []
  if (!url) missing.push('VITE_SUPABASE_URL')
  if (!anonKey) missing.push('VITE_SUPABASE_ANON_KEY')
  if (!url || !anonKey) throw new MissingSupabaseConfigError(missing)

  return { url, anonKey }
}

/** Creates a browser-safe (anon key, RLS-enforced) Supabase client. */
export function createSupabaseClient(
  config: SupabaseConfig,
  options?: SupabaseClientOptions<'public'>,
): TypedSupabaseClient {
  return createClient<Database, 'public'>(config.url, config.anonKey, {
    ...options,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...options?.auth,
    },
  })
}

let cachedClient: TypedSupabaseClient | undefined

/**
 * Per-app singleton client built from the Vite env. Kept as a single instance so
 * both portals share one auth session/refresh loop per page load.
 */
export function getSupabaseClient(
  env: SupabaseEnv,
  options?: SupabaseClientOptions<'public'>,
): TypedSupabaseClient {
  cachedClient ??= createSupabaseClient(readSupabaseEnv(env), options)
  return cachedClient
}

/** Test/HMR escape hatch: drops the memoized client. */
export function resetSupabaseClient(): void {
  cachedClient = undefined
}
