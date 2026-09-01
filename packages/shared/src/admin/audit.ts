import type { TypedSupabaseClient } from '../supabase/client'
import type { Database } from '../types/database.types'
import type { Uuid } from '../types/domain'
import { dbError } from '../owner/db-error'

export type AuditRow = Database['public']['Functions']['query_audit_log']['Returns'][number]

export const AUDIT_PAGE_SIZE = 50

export interface AuditFilters {
  actorUserId: Uuid | null
  actionType: string | null
  /** Local calendar day, `YYYY-MM-DD`. */
  fromDate: string | null
  toDate: string | null
  offset: number
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  actorUserId: null,
  actionType: null,
  fromDate: null,
  toDate: null,
  offset: 0,
}

export const auditKeys = {
  all: ['audit'] as const,
  list: (filters: AuditFilters) =>
    [
      'audit',
      'list',
      filters.actorUserId,
      filters.actionType,
      filters.fromDate,
      filters.toDate,
      filters.offset,
    ] as const,
  facets: ['audit', 'facets'] as const,
}

function dayStart(day: string | null): string | undefined {
  return day ? new Date(`${day}T00:00:00`).toISOString() : undefined
}

function dayEnd(day: string | null): string | undefined {
  return day ? new Date(`${day}T23:59:59.999`).toISOString() : undefined
}

export async function queryAuditLog(
  client: TypedSupabaseClient,
  filters: AuditFilters,
  limit: number,
): Promise<AuditRow[]> {
  const { data, error } = await client.rpc('query_audit_log', {
    p_actor_user_id: filters.actorUserId ?? undefined,
    p_action_type: filters.actionType ?? undefined,
    p_from_date: dayStart(filters.fromDate),
    p_to_date: dayEnd(filters.toDate),
    p_limit: limit,
    p_offset: filters.offset,
  })
  if (error) throw dbError(error, 'The audit log could not be loaded.')
  return data ?? []
}

export interface AuditPage {
  rows: AuditRow[]
  hasMore: boolean
}

/** One extra row tells the pager whether a next page exists without a count query. */
export async function getAuditPage(
  client: TypedSupabaseClient,
  filters: AuditFilters,
): Promise<AuditPage> {
  const rows = await queryAuditLog(client, filters, AUDIT_PAGE_SIZE + 1)
  return { rows: rows.slice(0, AUDIT_PAGE_SIZE), hasMore: rows.length > AUDIT_PAGE_SIZE }
}
