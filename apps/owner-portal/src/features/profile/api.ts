import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOwnerProfile,
  profileKeys,
  updateOwnerProfile,
  type OwnerProfileUpdateInput,
  type Uuid,
} from '@itoby/shared'
import { supabase } from '@/lib/supabase'

export { profileKeys, type OwnerProfile } from '@itoby/shared'

export function useOwnerProfile(userId: Uuid) {
  return useQuery({
    queryKey: profileKeys.self(userId),
    queryFn: () => getOwnerProfile(supabase()),
  })
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: OwnerProfileUpdateInput) => updateOwnerProfile(supabase(), input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  })
}
