import { z } from 'zod'
import { COMPLAINT_STATUSES } from '../types/domain'

/** Mirrors the `complaint_event.comment_text` / `maintenance_complaint.description` bounds. */
export const COMPLAINT_TEXT_MAX = 2000

export const complaintCommentSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(1, 'Enter a comment.')
    .max(COMPLAINT_TEXT_MAX, `Comment must not exceed ${COMPLAINT_TEXT_MAX} characters.`),
})

export type ComplaintCommentInput = z.infer<typeof complaintCommentSchema>

/** Attachment bounds mirror requirements.md (Requirement 6.1) and `upload-attachment`. */
export const COMPLAINT_ATTACHMENT_MAX_COUNT = 5
export const COMPLAINT_ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

/** Category is validated against `complaint_categories` server-side (Requirement 6.5). */
export const complaintSubmissionSchema = z.object({
  office_unit_id: z.uuid('Select one of your office units.'),
  category: z.string().trim().min(1, 'Select a category.'),
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description.')
    .max(COMPLAINT_TEXT_MAX, `Description must not exceed ${COMPLAINT_TEXT_MAX} characters.`),
})

export type ComplaintSubmissionInput = z.infer<typeof complaintSubmissionSchema>

/** `update_complaint_status` accepts these two targets only (Requirement 7.3). */
export const COMPLAINT_UPDATABLE_STATUSES = ['IN_PROGRESS', 'RESOLVED'] as const
export type ComplaintUpdatableStatus = (typeof COMPLAINT_UPDATABLE_STATUSES)[number]

export const complaintStatusUpdateSchema = z.object({
  status: z.enum(COMPLAINT_UPDATABLE_STATUSES, { error: 'Select a status.' }),
})

export type ComplaintStatusUpdateInput = z.infer<typeof complaintStatusUpdateSchema>

export const complaintAssignmentSchema = z.object({
  staff_id: z.uuid('Select a maintenance staff member.'),
})

export type ComplaintAssignmentInput = z.infer<typeof complaintAssignmentSchema>

export const complaintStatusFilterSchema = z.enum(COMPLAINT_STATUSES)
