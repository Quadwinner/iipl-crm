import type { TypedSupabaseClient } from '../supabase/client'

/** Failure from an Edge Function, carrying the HTTP status so callers can map it inline. */
export class EdgeFunctionError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(message: string, status: number, code: string | null = null) {
    super(message)
    this.name = 'EdgeFunctionError'
    this.status = status
    this.code = code
  }
}

interface EdgeErrorBody {
  error?: string
  error_code?: string
  message?: string
}

/**
 * Invokes an Edge Function with the caller's session JWT. Gateway secrets and the
 * service-role key stay server-side — clients only ever hold the anon key.
 *
 * The client is a parameter rather than an import so this works from the web
 * apps and from React Native, which build their clients differently.
 */
export async function invokeEdgeFunction<T>(
  client: TypedSupabaseClient,
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  return await invoke<T>(client, name, body)
}

/**
 * Multipart variant for functions that take a file (`upload-attachment`). supabase-js
 * sets the multipart boundary itself, so the FormData is passed through untouched.
 */
export async function invokeEdgeFunctionMultipart<T>(
  client: TypedSupabaseClient,
  name: string,
  form: FormData,
): Promise<T> {
  return await invoke<T>(client, name, form)
}

async function invoke<T>(
  client: TypedSupabaseClient,
  name: string,
  body: Record<string, unknown> | FormData,
): Promise<T> {
  const { data, error } = await client.functions.invoke<T>(name, { body })

  if (error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      const payload = await readErrorBody(context)
      throw new EdgeFunctionError(
        payload?.error ?? payload?.message ?? error.message,
        context.status,
        payload?.error_code ?? null,
      )
    }
    throw new EdgeFunctionError(error.message, 0)
  }

  return data as T
}

async function readErrorBody(response: Response): Promise<EdgeErrorBody | null> {
  try {
    return (await response.json()) as EdgeErrorBody
  } catch {
    return null
  }
}
