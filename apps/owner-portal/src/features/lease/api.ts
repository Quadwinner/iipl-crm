import { useQuery } from '@tanstack/react-query'
import { leaseKeys, listOwnerLeases } from '@itoby/shared'
import { supabase } from '@/lib/supabase'

// The query, its types and daysUntil live in @itoby/shared/owner so the Expo
// app runs exactly the same code. Only this hook is app-specific.
export { daysUntil, leaseKeys, type OwnerLeaseRow } from '@itoby/shared'

export function useOwnerLeases() {
  return useQuery({
    queryKey: leaseKeys.list(),
    queryFn: () => listOwnerLeases(supabase()),
  })
}
