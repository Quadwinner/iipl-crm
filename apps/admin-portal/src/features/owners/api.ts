import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listOwners,
  ownerKeys,
  type OwnerCreateInput,
  type OwnerFilters,
  type OwnerRow,
  type OwnerStatus,
  type Uuid,
} from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { invokeEdgeFunction } from '@/lib/edge-function'
import { supabase } from '@/lib/supabase'

export { ownerKeys, type OwnerFilters, type OwnerRow } from '@itoby/shared'

export function useOwners(filters: OwnerFilters) {
  return useQuery({
    queryKey: ownerKeys.list(filters),
    queryFn: () => listOwners(supabase(), filters),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownerKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['tenants'] })
    },
  })
}

/** Revokes sessions and sets status in one Postgres RPC — faster than an Edge Function round-trip. */
export function useDeactivateOwner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ownerId: Uuid) => {
      const { data, error } = await supabase().rpc('deactivate_owner', {
        p_owner_id: ownerId,
      })
      if (error) throw dbError(error, 'The tenant account could not be deactivated.')
      return data
    },
    onMutate: async (ownerId) => {
      await queryClient.cancelQueries({ queryKey: ownerKeys.all })

      const previous = queryClient.getQueriesData<OwnerRow[]>({ queryKey: ownerKeys.all })
      queryClient.setQueriesData<OwnerRow[]>({ queryKey: ownerKeys.all }, (owners) =>
        owners?.map((owner) =>
          owner.id === ownerId ? { ...owner, status: 'DEACTIVATED' } : owner,
        ),
      )

      return { previous }
    },
    onError: (_error, _ownerId, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ownerKeys.all })
    },
  })
}
