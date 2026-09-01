import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { OccupancyStatus, Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export type UnitRow = Database['public']['Functions']['list_office_units']['Returns'][number]

export interface BuildingRow {
  id: Uuid
  name: string
  address: string
  created_at: string
  updated_at: string
  unit_count: number
}

export interface BuildingOption {
  id: Uuid
  name: string
}

export interface UnitFilters {
  buildingId: Uuid | null
  occupancyStatus: OccupancyStatus | null
}

export interface OccupancySummary {
  occupiedCount: number
  vacantCount: number
  totalCount: number
}

export const buildingKeys = {
  all: ['buildings', 'full'] as const,
  list: ['buildings', 'full', 'list'] as const,
}

export const unitKeys = {
  all: ['units'] as const,
  buildings: ['buildings'] as const,
  list: (filters: UnitFilters) =>
    ['units', 'list', filters.buildingId, filters.occupancyStatus] as const,
  occupancy: (buildingId: Uuid | null) => ['units', 'occupancy', buildingId] as const,
}

/** Buildings with how many units each holds. Two reads because there is no count view. */
export async function listBuildings(client: TypedSupabaseClient): Promise<BuildingRow[]> {
  const [buildings, units] = await Promise.all([
    client.from('building').select('id, name, address, created_at, updated_at').order('name'),
    client.from('office_unit').select('building_id'),
  ])

  if (buildings.error) throw dbError(buildings.error, 'Buildings could not be loaded.')
  if (units.error) throw dbError(units.error, 'Unit counts could not be loaded.')

  const counts = new Map<string, number>()
  for (const unit of units.data ?? []) {
    counts.set(unit.building_id, (counts.get(unit.building_id) ?? 0) + 1)
  }

  return (buildings.data ?? []).map((building) => ({
    ...building,
    unit_count: counts.get(building.id) ?? 0,
  }))
}

/** Just id and name, for pickers. */
export async function listBuildingOptions(
  client: TypedSupabaseClient,
): Promise<BuildingOption[]> {
  const { data, error } = await client.from('building').select('id, name').order('name')
  if (error) throw dbError(error, 'Buildings could not be loaded.')
  return data ?? []
}

export async function listUnits(
  client: TypedSupabaseClient,
  filters: UnitFilters,
): Promise<UnitRow[]> {
  const { data, error } = await client.rpc('list_office_units', {
    p_building_id: filters.buildingId ?? undefined,
    p_occupancy_status: filters.occupancyStatus ?? undefined,
  })
  if (error) throw dbError(error, 'Office units could not be loaded.')
  return data ?? []
}

export async function getOccupancySummary(
  client: TypedSupabaseClient,
  buildingId: Uuid | null,
): Promise<OccupancySummary> {
  const { data, error } = await client.rpc('occupancy_summary', {
    p_building_id: buildingId ?? undefined,
  })
  if (error) throw dbError(error, 'Occupancy counts could not be loaded.')

  const row = data?.[0]
  return {
    occupiedCount: row?.occupied_count ?? 0,
    vacantCount: row?.vacant_count ?? 0,
    totalCount: row?.total_count ?? 0,
  }
}
