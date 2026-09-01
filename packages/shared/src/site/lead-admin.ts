import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadStatus = Database['public']['Enums']['lead_status']

export const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED']

export const leadKeys = {
  all: ['leads'] as const,
}

/**
 * Leads are readable only by roles holding LEAD_READ — enforced by the
 * leads_select_staff RLS policy, not by this query.
 */
export async function listLeads(client: TypedSupabaseClient): Promise<Lead[]> {
  const { data, error } = await client
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Status changes go through the RPC, never a direct UPDATE: it pairs
 * require_permission('LEAD_MANAGE') with the audit row in one transaction, so a
 * failed audit write rolls the change back.
 */
export async function updateLeadStatus(
  client: TypedSupabaseClient,
  input: { id: string; status: LeadStatus; notes?: string },
): Promise<void> {
  const { error } = await client.rpc('update_lead_status', {
    p_lead_id: input.id,
    p_status: input.status,
    p_staff_notes: input.notes,
  })
  if (error) throw new Error(error.message)
}
