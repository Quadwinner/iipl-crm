import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Database, StaffCreateInput, Uuid } from '@itoby/shared'
import { dbError } from '@rental-admin/lib/db-error'
import { invokeEdgeFunction } from '@rental-admin/lib/edge-function'
import { supabase } from '@rental-admin/lib/supabase'

export type StaffRow = Database['public']['Functions']['list_staff']['Returns'][number]

export const staffKeys = {
  all: ['staff'] as const,
  list: (includeInactive: boolean) => ['staff', 'list', includeInactive] as const,
}

export function useStaff(includeInactive = true) {
  return useQuery({
    queryKey: staffKeys.list(includeInactive),
    queryFn: async (): Promise<StaffRow[]> => {
      const { data, error } = await supabase().rpc('list_staff', {
        p_include_inactive: includeInactive,
      })
      if (error) throw dbError(error, 'Maintenance staff could not be loaded.')
      return data ?? []
    },
  })
}

interface CreateStaffResponse {
  success: boolean
  data?: {
    user_id: Uuid
    full_name: string
    phone: string
    is_active: boolean
  }
}

/** Account creation needs the Auth admin API, so it runs in the `create-staff` Edge Function. */
export function useCreateStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: StaffCreateInput) =>
      invokeEdgeFunction<CreateStaffResponse>('create-staff', {
        name: input.name,
        email: input.email,
        phone: input.phone,
        password: input.password,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['maintenance-staff'] })
    },
  })
}

export function useSetStaffActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, active }: { userId: Uuid; active: boolean }) => {
      const { data, error } = await supabase().rpc('set_staff_active', {
        p_user_id: userId,
        p_active: active,
      })
      if (error) throw dbError(error, 'The staff account could not be updated.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['maintenance-staff'] })
    },
  })
}
