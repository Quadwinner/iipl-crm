import { z } from 'zod'
import { ownerEmailSchema, ownerNameSchema, ownerPasswordSchema, ownerPhoneSchema } from './owner'

/** Staff accounts share the account bounds in requirements.md (Requirements 5.3, 5.4). */
export const staffCreateSchema = z.object({
  name: ownerNameSchema,
  email: ownerEmailSchema,
  phone: ownerPhoneSchema,
  password: ownerPasswordSchema,
})

export type StaffCreateInput = z.infer<typeof staffCreateSchema>
