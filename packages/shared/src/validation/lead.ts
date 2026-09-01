import { z } from 'zod'

/**
 * Mirrors what `submit_lead` enforces server-side, so a visitor is told about a
 * bad field before the round trip rather than after it. The RPC re-checks both
 * — this is a courtesy, not the gate.
 *
 * Only name and email are required, matching the two exceptions the function
 * raises. Everything else is optional because a half-filled enquiry is still an
 * enquiry, and refusing one would lose real leads.
 */
export const leadFormSchema = z.object({
  full_name: z.string().trim().min(1, 'Enter your name.').max(120, 'That name is too long.'),
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .pipe(z.email('Enter a valid email address.')),
  phone: z.string().trim().max(32, 'That phone number is too long.').default(''),
  company: z.string().trim().max(160, 'That company name is too long.').default(''),
  service_interest: z.string().trim().default(''),
  budget_range: z.string().trim().default(''),
  message: z.string().trim().max(4000, 'Please keep the message under 4000 characters.').default(''),
})

export type LeadFormInput = z.infer<typeof leadFormSchema>

/** Field name -> first message, for rendering errors next to their input. */
export type LeadFieldErrors = Partial<Record<keyof LeadFormInput, string>>

export function leadFieldErrors(error: z.ZodError<LeadFormInput>): LeadFieldErrors {
  const out: LeadFieldErrors = {}
  for (const issue of error.issues) {
    const field = issue.path[0]
    if (typeof field === 'string' && !(field in out)) {
      out[field as keyof LeadFormInput] = issue.message
    }
  }
  return out
}

/**
 * Postgres error codes `submit_lead` raises deliberately, with messages written
 * for a visitor. Anything else is a real fault and must not be echoed to the
 * page — a raw database error can leak schema details and reads as a crash.
 */
const VISITOR_SAFE_CODES = new Set(['22023', '53400'])

export function leadErrorMessage(cause: unknown): string {
  const code = (cause as { code?: string } | null)?.code
  const message = (cause as { message?: string } | null)?.message

  if (code && VISITOR_SAFE_CODES.has(code) && message) return message
  return 'That could not be sent right now. Please try again in a moment.'
}
