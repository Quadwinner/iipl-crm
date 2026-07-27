import { z } from 'zod'
import { ownerNameSchema, ownerPhoneSchema } from './owner'

/** Self-service profile edit. Phone is optional; name is what the audit trail shows. */
export const myProfileSchema = z.object({
  full_name: ownerNameSchema,
  phone: z.union([z.literal(''), ownerPhoneSchema]),
})

export type MyProfileInput = z.infer<typeof myProfileSchema>
