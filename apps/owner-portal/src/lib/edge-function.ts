import { invokeEdgeFunction as invoke, invokeEdgeFunctionMultipart as invokeMultipart } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

/**
 * App-local wrappers that supply this app's Supabase client. The shared
 * implementations take the client as a parameter so React Native can pass its
 * own; these keep the existing call sites unchanged.
 */
export { EdgeFunctionError } from '@itoby/shared'

export function invokeEdgeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  return invoke<T>(supabase(), name, body)
}

export function invokeEdgeFunctionMultipart<T>(name: string, form: FormData): Promise<T> {
  return invokeMultipart<T>(supabase(), name, form)
}
