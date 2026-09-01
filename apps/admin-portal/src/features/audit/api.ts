import { useQuery } from '@tanstack/react-query'
import {
  auditKeys,
  EMPTY_AUDIT_FILTERS,
  getAuditPage,
  queryAuditLog,
  type AuditFilters,
  type Uuid,
} from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export {
  AUDIT_PAGE_SIZE,
  auditKeys,
  EMPTY_AUDIT_FILTERS,
  type AuditFilters,
  type AuditRow,
} from '@itoby/shared'

/** One extra row tells the pager whether a next page exists without a count query. */
export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => getAuditPage(supabase(), filters),
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
      const rows = await queryAuditLog(supabase(), { ...EMPTY_AUDIT_FILTERS }, 500)

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
