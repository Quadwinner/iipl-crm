import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MyProfileInput } from '@itoby/shared'
import { dbError } from '@/lib/db-error'
import { supabase } from '@/lib/supabase'

export interface MyProfile {
  full_name: string | null
  phone: string | null
}

export const profileKeys = {
  all: ['profile'] as const,
  me: (userId: string | undefined) => ['profile', 'me', userId] as const,
}

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.me(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyProfile> => {
      const { data, error } = await supabase()
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', userId as string)
        .single()
      if (error) throw dbError(error, 'Your profile could not be loaded.')
      return data
    },
  })
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MyProfileInput) => {
      const { data, error } = await supabase().rpc('update_my_profile', {
        p_full_name: input.full_name,
        p_phone: input.phone === '' ? null : input.phone,
      })
      if (error) throw dbError(error, 'Your profile could not be saved.')
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all })
      // The name this user is shown under comes back from the server with each
      // complaint and its history, so those caches are now stale.
      void queryClient.invalidateQueries({ queryKey: ['complaints'] })
      void queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
  })
}
