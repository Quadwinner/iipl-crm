import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { OwnerStatus, Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export type StaffRow = Database['public']['Functions']['list_staff']['Returns'][number]

export interface OwnerRow {
  id: Uuid
  user_id: Uuid
  name: string
  contact_email: string
  phone: string
  status: OwnerStatus
  created_at: string
  updated_at: string
}

export interface OwnerFilters {
  status: OwnerStatus | null
}

export const ownerKeys = {
  all: ['owners'] as const,
  list: (filters: OwnerFilters) => ['owners', 'list', filters.status] as const,
}

export const staffKeys = {
  all: ['staff'] as const,
  list: (includeInactive: boolean) => ['staff', 'list', includeInactive] as const,
}

export async function listOwners(
  client: TypedSupabaseClient,
  filters: OwnerFilters,
): Promise<OwnerRow[]> {
  let query = client
    .from('office_owners')
    .select('id, user_id, name, contact_email, phone, status, created_at, updated_at')
    .order('name')

  if (filters.status !== null) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw dbError(error, 'Office owners could not be loaded.')
  return data ?? []
}

export async function listStaff(
  client: TypedSupabaseClient,
  includeInactive = true,
): Promise<StaffRow[]> {
  const { data, error } = await client.rpc('list_staff', {
    p_include_inactive: includeInactive,
  })
  if (error) throw dbError(error, 'Maintenance staff could not be loaded.')
  return data ?? []
}
