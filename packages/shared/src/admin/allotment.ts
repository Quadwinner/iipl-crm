import type { TypedSupabaseClient } from '../supabase/client'
import type { AllotmentStatus, BillingCycle, Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export interface AllotmentListRow {
  id: Uuid
  status: AllotmentStatus
  created_at: string
  terminated_at: string | null
  expiration_reason: string | null
  office_unit_id: Uuid
  unit_code: string
  building_name: string
  office_owner_id: Uuid
  owner_name: string
  owner_email: string
  lease_start: string | null
  lease_end: string | null
  rent_amount: number | null
  billing_cycle: BillingCycle | null
}

export interface AllotmentFilters {
  status: AllotmentStatus | null
  ownerId: Uuid | null
}

export interface VacantUnitOption {
  id: Uuid
  unit_code: string
  building_name: string
  base_rent_amount: number
}

export const allotmentKeys = {
  all: ['allotments'] as const,
  list: (filters: AllotmentFilters) =>
    ['allotments', 'list', filters.status, filters.ownerId] as const,
  history: (unitId: Uuid | null) => ['allotments', 'history', unitId] as const,
  vacantUnits: ['allotments', 'vacant-units'] as const,
}

const LIST_SELECT =
  'id, status, created_at, terminated_at, expiration_reason, office_unit_id, office_owner_id, office_unit(unit_code, building(name)), office_owners(name, contact_email), lease(start_date, end_date, rent_amount, billing_cycle)'

export async function listAllotments(
  client: TypedSupabaseClient,
  filters: AllotmentFilters,
): Promise<AllotmentListRow[]> {
  let query = client.from('allotment').select(LIST_SELECT).order('created_at', { ascending: false })

  if (filters.status !== null) query = query.eq('status', filters.status)
  if (filters.ownerId !== null) query = query.eq('office_owner_id', filters.ownerId)

  const { data, error } = await query
  if (error) throw dbError(error, 'Allotments could not be loaded.')

  return (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    terminated_at: row.terminated_at,
    expiration_reason: row.expiration_reason,
    office_unit_id: row.office_unit_id,
    unit_code: row.office_unit?.unit_code ?? '—',
    building_name: row.office_unit?.building?.name ?? '—',
    office_owner_id: row.office_owner_id,
    owner_name: row.office_owners?.name ?? '—',
    owner_email: row.office_owners?.contact_email ?? '—',
    lease_start: row.lease?.start_date ?? null,
    lease_end: row.lease?.end_date ?? null,
    rent_amount: row.lease?.rent_amount ?? null,
    billing_cycle: row.lease?.billing_cycle ?? null,
  }))
}

/** Only vacant units can be allotted (Requirements 2.4, 3.1); the RPC re-checks server-side. */
export async function listVacantUnits(
  client: TypedSupabaseClient,
): Promise<VacantUnitOption[]> {
  const { data, error } = await client.rpc('list_office_units', { p_occupancy_status: 'VACANT' })
  if (error) throw dbError(error, 'Vacant units could not be loaded.')

  return (data ?? []).map((unit) => ({
    id: unit.id,
    unit_code: unit.unit_code,
    building_name: unit.building_name,
    base_rent_amount: unit.base_rent_amount,
  }))
}
