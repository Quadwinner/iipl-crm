import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { leadKeys, listLeads, updateLeadStatus, type LeadStatus } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export { LEAD_STATUSES, leadKeys, type Lead, type LeadStatus } from '@itoby/shared'

export function useLeads() {
  return useQuery({ queryKey: leadKeys.all, queryFn: () => listLeads(supabase()) })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; status: LeadStatus; notes?: string }) =>
      updateLeadStatus(supabase(), vars),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  })
}
