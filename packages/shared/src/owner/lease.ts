import type { TypedSupabaseClient } from '../supabase/client'
import type { AllotmentStatus, BillingCycle, Uuid } from '../types/domain'
import { dbError } from './db-error'

export interface OwnerLeaseRow {
  id: Uuid
  status: AllotmentStatus
  office_unit_id: Uuid
  unit_code: string
  building_name: string
  floor: number | null
  size_sqft: number | null
  lease_id: Uuid | null
  lease_start: string | null
  lease_end: string | null
  rent_amount: number | null
  billing_cycle: BillingCycle | null
  created_at: string
}

export const leaseKeys = {
  all: ['owner-leases'] as const,
  list: () => ['owner-leases', 'list'] as const,
}

/**
 * The signed-in owner's allotments with their lease terms.
 *
 * No owner id is passed: RLS scopes this to the caller, resolved server-side
 * from their session. Passing one from the client would be the bug this
 * arrangement exists to prevent.
 */
export async function listOwnerLeases(client: TypedSupabaseClient): Promise<OwnerLeaseRow[]> {
  const { data, error } = await client
    .from('allotment')
    .select(
      'id, status, created_at, office_unit_id, office_unit(unit_code, floor, size_sqft, building(name)), lease(id, start_date, end_date, rent_amount, billing_cycle)',
    )
    .order('created_at', { ascending: false })

  if (error) throw dbError(error, 'Your leases could not be loaded.')

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    office_unit_id: row.office_unit_id,
    unit_code: row.office_unit?.unit_code ?? '—',
    building_name: row.office_unit?.building?.name ?? '—',
    floor: row.office_unit?.floor ?? null,
    size_sqft: row.office_unit?.size_sqft ?? null,
    lease_id: row.lease?.id ?? null,
    lease_start: row.lease?.start_date ?? null,
    lease_end: row.lease?.end_date ?? null,
    rent_amount: row.lease?.rent_amount ?? null,
    billing_cycle: row.lease?.billing_cycle ?? null,
    created_at: row.created_at,
  }))
}

export function daysUntil(date: string | null | undefined): number | null {
  if (!date) return null
  const end = new Date(`${date.slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}
