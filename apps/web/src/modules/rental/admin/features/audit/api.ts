import { useQuery } from '@tanstack/react-query'
import type { Database, Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { supabase } from '@rental-admin/lib/supabase'

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

async function queryAuditLog(filters: AuditFilters, limit: number): Promise<AuditRow[]> {
  const { data, error } = await supabase().rpc('query_audit_log', {
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

/** One extra row tells the pager whether a next page exists without a count query. */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: async () => {
      const rows = await queryAuditLog(filters, AUDIT_PAGE_SIZE + 1)
      return { rows: rows.slice(0, AUDIT_PAGE_SIZE), hasMore: rows.length > AUDIT_PAGE_SIZE }
    },
  })
}

export interface AuditFacets {
  actors: Array<{ id: Uuid; label: string }>
  actionTypes: string[]
}

/** Filter options come from the recorded entries themselves, so no list goes stale. */
export function useAuditFacets() {
  return useQuery({
    queryKey: auditKeys.facets,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AuditFacets> => {
      const rows = await queryAuditLog({ ...EMPTY_AUDIT_FILTERS }, 500)

      const actors = new Map<Uuid, string>()
      const actionTypes = new Set<string>()
      for (const row of rows) {
        if (row.actor_user_id) {
          actors.set(row.actor_user_id, row.actor_email ?? row.actor_user_id)
        }
        actionTypes.add(row.action_type)
      }

      return {
        actors: [...actors].map(([id, label]) => ({ id, label })).sort(byLabel),
        actionTypes: [...actionTypes].sort(),
      }
    },
  })
}

function byLabel(a: { label: string }, b: { label: string }): number {
  return a.label.localeCompare(b.label)
}
