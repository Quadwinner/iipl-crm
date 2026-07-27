import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { OwnerCreateInput, OwnerStatus, Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { invokeEdgeFunction } from '@/lib/edge-function'
import { supabase } from '@/lib/supabase'

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

export function useOwners(filters: OwnerFilters) {
  return useQuery({
    queryKey: ownerKeys.list(filters),
    queryFn: async (): Promise<OwnerRow[]> => {
      let query = supabase()
        .from('office_owners')
        .select('id, user_id, name, contact_email, phone, status, created_at, updated_at')
        .order('name')

      if (filters.status !== null) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) throw dbError(error, 'Office owners could not be loaded.')
      return data ?? []
    },
  })
}

interface CreateOwnerResponse {
  success: boolean
  data?: {
    owner_id: Uuid
    user_id: Uuid
    name: string
    contact_email: string
    phone: string
    status: OwnerStatus
  }
}

/** Account creation needs the Auth admin API, so it runs in the `create-owner` Edge Function. */
export function useCreateOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: OwnerCreateInput) =>
      invokeEdgeFunction<CreateOwnerResponse>('create-owner', {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ownerKeys.all }),
  })
}

interface DeactivateOwnerResponse {
  success: boolean
  message?: string
}

/** Session revocation is admin-API work, so it runs in the `deactivate-owner` Edge Function. */
export function useDeactivateOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ownerId: Uuid) =>
      invokeEdgeFunction<DeactivateOwnerResponse>('deactivate-owner', { owner_id: ownerId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownerKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['allotments'] })
    },
  })
}
