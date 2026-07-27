import { z } from 'zod'

/**
 * A document must be linked to a Lease or an Office_Owner (Requirement 13.1). The portal
 * always sends the owner; a lease link is optional and, when present, the Edge Function
 * re-resolves the owner from the lease's allotment.
 */
export const documentLinkSchema = z.object({
  office_owner_id: z.uuid('Select an office owner.'),
  lease_id: z.union([z.uuid(), z.literal('')]).optional(),
})

export type DocumentLinkInput = z.infer<typeof documentLinkSchema>
