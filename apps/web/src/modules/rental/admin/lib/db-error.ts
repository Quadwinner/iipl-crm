/** Error thrown by data-access helpers, carrying the Postgres errcode for inline mapping. */
export class DbError extends Error {
  readonly code: string | null

  constructor(message: string, code: string | null = null) {
    super(message)
    this.name = 'DbError'
    this.code = code
  }
}

export function dbError(
  error: { message?: string | null; code?: string | null },
  fallback: string,
): DbError {
  return new DbError(error.message?.trim() || fallback, error.code ?? null)
}

export interface InlineError {
  /** Field to attach the message to, or null for a form-level message. */
  field: string | null
  message: string
}

interface ConflictTarget {
  field: string
  message: string
}

/**
 * The database is the real authority on every write, so its errcode decides what the
 * operator sees: 42501 denied, 23505 conflict, 22023/23514 invalid value.
 */
export function mapDbError(error: unknown, conflict?: ConflictTarget): InlineError {
  const code = error instanceof DbError ? error.code : null
  const message = error instanceof Error ? error.message : String(error)

  switch (code) {
    case '42501':
      return { field: null, message: 'Your role is not permitted to make this change.' }
    case '23505':
      return conflict ?? { field: null, message }
    case '22023':
    case '23514':
    case '22003':
      return { field: null, message: `Invalid value: ${message}` }
    case '23503':
      return { field: null, message: 'A referenced record no longer exists.' }
    case 'P0002':
      return { field: null, message: 'That office unit no longer exists.' }
    default:
      return { field: null, message }
  }
}
