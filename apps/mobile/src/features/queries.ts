import { useQuery } from '@tanstack/react-query'
import {
  complaintKeys,
  getComplaintHistory,
  getOwnerProfile,
  listAllottedUnits,
  listComplaintCategories,
  listFileTypeRules,
  profileKeys,
  documentKeys,
  invoiceKeys,
  leaseKeys,
  listOwnerComplaints,
  listOwnerDocuments,
  listOwnerInvoices,
  listOwnerLeases,
  listOwnerReceipts,
  listOwnerReminders,
  receiptKeys,
  reminderKeys,
} from '@itoby/shared/owner'
import { supabase } from '../lib/supabase'

/**
 * Every hook here is a React Query wrapper over a query function from
 * @itoby/shared — the same one the web owner portal calls. If a query needs
 * changing, it changes in one place and both apps pick it up.
 */

export function useLeases() {
  return useQuery({ queryKey: leaseKeys.list(), queryFn: () => listOwnerLeases(supabase()) })
}

export function useInvoices() {
  return useQuery({ queryKey: invoiceKeys.list(), queryFn: () => listOwnerInvoices(supabase()) })
}

export function useReceipts() {
  return useQuery({ queryKey: receiptKeys.all, queryFn: () => listOwnerReceipts(supabase()) })
}

export function useComplaints() {
  return useQuery({ queryKey: complaintKeys.list(), queryFn: () => listOwnerComplaints(supabase()) })
}

export function useDocuments() {
  return useQuery({ queryKey: documentKeys.all, queryFn: () => listOwnerDocuments(supabase()) })
}

export function useComplaintHistory(complaintId: string | null) {
  return useQuery({
    queryKey: complaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: () => getComplaintHistory(supabase(), complaintId as string),
  })
}

export function useComplaintCategories() {
  return useQuery({
    queryKey: complaintKeys.categories,
    staleTime: 5 * 60_000,
    queryFn: () => listComplaintCategories(supabase()),
  })
}

export function useAllottedUnits() {
  return useQuery({
    queryKey: complaintKeys.allottedUnits,
    queryFn: () => listAllottedUnits(supabase()),
  })
}

export function useFileTypeRules() {
  return useQuery({
    queryKey: complaintKeys.fileTypes,
    staleTime: 5 * 60_000,
    queryFn: () => listFileTypeRules(supabase()),
  })
}

export function useOwnerProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: () => getOwnerProfile(supabase()),
  })
}

export function useReminders() {
  return useQuery({
    queryKey: reminderKeys.list(),
    queryFn: () => listOwnerReminders(supabase()),
    refetchInterval: 60_000,
  })
}
