import AsyncStorage from '@react-native-async-storage/async-storage'
import { processLock } from '@supabase/supabase-js'
import { createSupabaseClient, type TypedSupabaseClient } from '@itoby/shared/supabase'
import 'react-native-url-polyfill/auto'

/**
 * The app's Supabase client.
 *
 * Same factory the web apps use — only the storage and URL-detection differ:
 * React Native has no localStorage and no URL to parse a session out of, so
 * sessions persist in AsyncStorage and detectSessionInUrl is off.
 *
 * Expo inlines EXPO_PUBLIC_* at build time, so a missing value shows up as an
 * empty string here rather than as a build failure. Checking it explicitly turns
 * that into a sentence someone can act on, instead of supabase-js throwing
 * "supabaseUrl is required" from somewhere deep in a promise chain.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

export class MissingMobileConfigError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing ${missing.join(' and ')}. Copy apps/mobile/.env.example to ` +
        'apps/mobile/.env and fill it in from the root .env, then restart the dev ' +
        'server. For EAS builds, set them with `eas env:create`.',
    )
    this.name = 'MissingMobileConfigError'
  }
}

let client: TypedSupabaseClient | undefined

export function supabase(): TypedSupabaseClient {
  if (!client) {
    const missing: string[] = []
    if (!url) missing.push('EXPO_PUBLIC_SUPABASE_URL')
    if (!anonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY')
    if (missing.length > 0) throw new MissingMobileConfigError(missing)

    client = createSupabaseClient(
      { url, anonKey },
      {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          // React Native has no navigator.locks, which supabase-js reaches for by
          // default. Without an explicit lock its auth calls can wait forever on a
          // lock that never resolves — the app just sits on its loading screen.
          lock: processLock,
        },
      },
    )
  }
  return client
}
