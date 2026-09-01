import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'

export type LeadSource = Database['public']['Enums']['lead_source']

export interface LeadInput {
  full_name: string
  email: string
  phone?: string
  company?: string
  service_interest?: string
  module_key?: string | null
  budget_range?: string
  message?: string
  source: LeadSource
  /** Where the visitor was when they submitted — a route path, not a full URL. */
  page_path?: string
}

/** Budget bands offered on the quote and contact forms. */
export const BUDGET_RANGES = [
  'Under ₹1L',
  '₹1L – ₹5L',
  '₹5L – ₹15L',
  '₹15L+',
  'Not sure yet',
] as const

/**
 * The only public write path into `leads`.
 *
 * `submit_lead` is security definer and rate limited to five per email per
 * hour; the table itself has no INSERT policy, so nothing can reach it another
 * way. A 53400 comes back with a message written for the visitor, so the error
 * is thrown with the server's own wording rather than a generic failure — the
 * caller should show `error.message` as-is.
 */
export async function submitLead(
  client: TypedSupabaseClient,
  input: LeadInput,
): Promise<void> {
  const { error } = await client.rpc('submit_lead', {
    p_full_name: input.full_name.trim(),
    p_email: input.email.trim(),
    p_phone: input.phone?.trim() ?? '',
    p_company: input.company?.trim() ?? '',
    p_service_interest: input.service_interest ?? '',
    p_module_key: input.module_key ?? undefined,
    p_budget_range: input.budget_range ?? '',
    p_message: input.message?.trim() ?? '',
    p_source: input.source,
    p_page_path: input.page_path ?? '',
  })
  if (error) throw new Error(error.message)
}
