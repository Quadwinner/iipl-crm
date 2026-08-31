/**
 * Repointed at the superapp singleton. A second QueryClient would mean
 * mutations invalidating a cache nobody reads from.
 */
export { queryClient } from '@/lib/query-client'
