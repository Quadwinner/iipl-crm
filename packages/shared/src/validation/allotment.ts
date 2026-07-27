import { z } from 'zod'
import { ALLOTMENT_STATUSES, BILLING_CYCLES } from '../types/domain'

/** Lease rent bounds mirror requirements.md (Requirement 3.1) and the numeric(12,2) column. */
export const RENT_AMOUNT_MIN = 0.01
export const RENT_AMOUNT_MAX = 9_999_999.99

export const EXPIRATION_REASON_MAX = 500

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date in YYYY-MM-DD format.')

export const allotmentCreateSchema = z
  .object({
    office_unit_id: z.uuid('Select an office unit.'),
    office_owner_id: z.uuid('Select an office owner.'),
    lease_start: isoDate,
    lease_end: isoDate,
    rent_amount: z
      .number({ error: 'Enter a rent amount.' })
      .min(RENT_AMOUNT_MIN, `Rent amount must be at least ${RENT_AMOUNT_MIN}.`)
      .max(RENT_AMOUNT_MAX, `Rent amount must not exceed ${RENT_AMOUNT_MAX}.`),
    billing_cycle: z.enum(BILLING_CYCLES),
  })
  .refine((value) => value.lease_end > value.lease_start, {
    path: ['lease_end'],
    message: 'Lease end date must be after the lease start date.',
  })

export type AllotmentCreateInput = z.infer<typeof allotmentCreateSchema>

export const TERMINAL_ALLOTMENT_STATUSES = ['TERMINATED', 'EXPIRED'] as const
export type TerminalAllotmentStatus = (typeof TERMINAL_ALLOTMENT_STATUSES)[number]

/** Expiry records a reason (Requirement 3.6); termination does not (Requirement 3.3). */
export const allotmentTransitionSchema = z
  .object({
    target_status: z.enum(TERMINAL_ALLOTMENT_STATUSES),
    reason: z
      .string()
      .trim()
      .max(EXPIRATION_REASON_MAX, `Reason must not exceed ${EXPIRATION_REASON_MAX} characters.`)
      .optional(),
  })
  .refine((value) => value.target_status !== 'EXPIRED' || (value.reason ?? '').length > 0, {
    path: ['reason'],
    message: 'Enter the expiration reason.',
  })

export type AllotmentTransitionInput = z.infer<typeof allotmentTransitionSchema>

export const allotmentStatusFilterSchema = z.enum(ALLOTMENT_STATUSES)
