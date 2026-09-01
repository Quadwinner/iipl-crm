import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  complaintKeys,
  getComplaintHistory,
  listAllottedUnits,
  listComplaintCategories,
  listFileTypeRules,
  listOwnerComplaints,
  submitComplaint,
  type ComplaintSubmissionInput,
  type Uuid,
} from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export {
  acceptedTypesAttribute,
  acceptedTypesSummary,
  attachmentCountRejection,
  attachmentRejection,
  complaintKeys,
  type AllottedUnit,
  type ComplaintEventRow,
  type ComplaintRow,
  type FileTypeRule,
  type SubmitComplaintResult,
} from '@itoby/shared'

export function useOwnerComplaints() {
  return useQuery({
    queryKey: complaintKeys.list(),
    queryFn: () => listOwnerComplaints(supabase()),
  })
}

export function useComplaintEvents(complaintId: Uuid | null) {
  return useQuery({
    queryKey: complaintKeys.events(complaintId ?? 'none'),
    enabled: complaintId !== null,
    queryFn: () => getComplaintHistory(supabase(), complaintId as Uuid),
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

/** Browser-side input: real `File`s, which the shared layer takes as opaque form parts. */
export interface SubmitComplaintInput extends ComplaintSubmissionInput {
  attachments: File[]
}

export function useSubmitComplaint() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitComplaintInput) =>
      submitComplaint(supabase(), {
        ...input,
        attachments: input.attachments.map((file) => ({
          name: file.name,
          size: file.size,
          part: file,
        })),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: complaintKeys.all }),
  })
}
