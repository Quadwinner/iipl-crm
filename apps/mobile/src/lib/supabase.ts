import AsyncStorage from '@react-native-async-storage/async-storage'
import { createSupabaseClient, type TypedSupabaseClient } from '@itoby/shared/supabase'
import 'react-native-url-polyfill/auto'

/**
 * The app's Supabase client.
 *
 * Same factory the web apps use — only the storage and URL-detection differ:
 * React Native has no localStorage and no URL to parse a session out of, so
 * sessions persist in AsyncStorage and detectSessionInUrl is off.
 *
 * Env comes from EXPO_PUBLIC_* (inlined at build time by Expo) but is handed to
 * the shared reader under the names it expects, so one implementation serves
 * both platforms.
 */
let client: TypedSupabaseClient | undefined

export function supabase(): TypedSupabaseClient {
  client ??= createSupabaseClient(
    {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  )
  return client
}
