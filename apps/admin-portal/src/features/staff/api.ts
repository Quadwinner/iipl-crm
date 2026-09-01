import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listStaff, staffKeys, type StaffCreateInput, type Uuid } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { invokeEdgeFunction } from '@/lib/edge-function'
import { supabase } from '@/lib/supabase'

export { staffKeys, type StaffRow } from '@itoby/shared'

/** `create-staff` needs the Auth admin API, so it runs in an Edge Function. */
interface CreateStaffResponse {
  success: boolean
  data?: {
    user_id: Uuid
    full_name: string
    phone: string
    is_active: boolean
  }
}

export function useStaff(includeInactive = true) {
  return useQuery({
    queryKey: staffKeys.list(includeInactive),
    queryFn: () => listStaff(supabase(), includeInactive),
  })
}

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
