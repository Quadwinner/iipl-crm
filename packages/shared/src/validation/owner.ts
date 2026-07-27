import { z } from 'zod'
import { OWNER_STATUSES } from '../types/domain'

/** Bounds mirror requirements.md (Requirements 4.1, 4.3) and the office_owners constraints. */
export const OWNER_NAME_MIN = 1
export const OWNER_NAME_MAX = 100
export const OWNER_PHONE_MIN_DIGITS = 10
export const OWNER_PHONE_MAX_DIGITS = 15
export const OWNER_PASSWORD_MIN = 8

export const ownerNameSchema = z
  .string()
  .trim()
  .min(OWNER_NAME_MIN, 'Enter the owner name.')
  .max(OWNER_NAME_MAX, `Name must not exceed ${OWNER_NAME_MAX} characters.`)

export const ownerEmailSchema = z.email('Enter a valid email address.')

export const ownerPhoneSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${OWNER_PHONE_MIN_DIGITS},${OWNER_PHONE_MAX_DIGITS}}$`),
    `Phone must be ${OWNER_PHONE_MIN_DIGITS}-${OWNER_PHONE_MAX_DIGITS} digits.`,
  )

export const ownerPasswordSchema = z
  .string()
  .min(OWNER_PASSWORD_MIN, `Password must be at least ${OWNER_PASSWORD_MIN} characters.`)

export const ownerCreateSchema = z.object({
  name: ownerNameSchema,
  email: ownerEmailSchema,
  phone: ownerPhoneSchema,
  password: ownerPasswordSchema,
})

export type OwnerCreateInput = z.infer<typeof ownerCreateSchema>

export const ownerProfileUpdateSchema = z.object({
  name: ownerNameSchema,
  contact_email: ownerEmailSchema,
  phone: ownerPhoneSchema,
})

export type OwnerProfileUpdateInput = z.infer<typeof ownerProfileUpdateSchema>

export const ownerStatusFilterSchema = z.enum(OWNER_STATUSES)
