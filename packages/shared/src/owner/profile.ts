import type { TypedSupabaseClient } from '../supabase/client'
import type { OwnerProfileUpdateInput } from '../validation/owner'
import type { OwnerStatus, Uuid } from '../types/domain'
import { dbError } from './db-error'

export interface OwnerProfile {
  id: Uuid
  name: string
  contact_email: string
  phone: string
  status: OwnerStatus
  created_at: string
  updated_at: string
}

export const profileKeys = {
  all: ['profile'] as const,
  self: (userId: Uuid) => ['profile', 'self', userId] as const,
}

/**
 * Reads the caller's own owner record. No owner id is sent: RLS resolves the row from
 * `auth.uid()`, so this can only ever return the caller's own profile.
 */
export async function getOwnerProfile(client: TypedSupabaseClient): Promise<OwnerProfile> {
  const { data, error } = await client
    .from('office_owners')
    .select('id, name, contact_email, phone, status, created_at, updated_at')
    .maybeSingle()

  if (error) throw dbError(error, 'Your profile could not be loaded.')
  if (!data) throw dbError({}, 'Your profile could not be loaded.')
  return data
}

/** `update_owner_profile` resolves the owner from `auth.uid()`; no owner id is passed. */
export async function updateOwnerProfile(
  client: TypedSupabaseClient,
  input: OwnerProfileUpdateInput,
): Promise<OwnerProfile> {
  const { data, error } = await client.rpc('update_owner_profile', {
    p_name: input.name,
    p_contact_email: input.contact_email,
    p_phone: input.phone,
  })
  if (error) throw dbError(error, 'Your profile could not be updated.')
  return data as OwnerProfile
}
