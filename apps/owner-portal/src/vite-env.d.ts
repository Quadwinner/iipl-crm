/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Razorpay publishable key id. The key secret stays in Edge Function secrets. */
  readonly VITE_RAZORPAY_KEY_ID?: string
}
