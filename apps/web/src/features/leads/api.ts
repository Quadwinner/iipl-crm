import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadStatus = Database['public']['Enums']['lead_status']

export const LEAD_STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED']

/**
 * Leads are readable only by roles holding LEAD_READ — enforced by the
 * leads_select_staff RLS policy, not by this query.
 */
export function useLeads() {
  return useQuery({
    queryKey: ['leads'],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase()
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return data ?? []
    },
  })
}

/**
 * Status changes go through the RPC, never a direct UPDATE: it pairs
 * require_permission('LEAD_MANAGE') with the audit row in one transaction, so a
 * failed audit write rolls the change back.
 */
export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { id: string; status: LeadStatus; notes?: string }) => {
      const { data, error } = await supabase().rpc('update_lead_status', {
        p_lead_id: vars.id,
        p_status: vars.status,
        p_staff_notes: vars.notes,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}
