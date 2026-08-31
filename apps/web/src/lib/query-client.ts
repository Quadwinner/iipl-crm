import { QueryClient } from '@tanstack/react-query'

/**
 * One QueryClient for the whole superapp. The rental copies re-export this
 * rather than constructing their own — two clients would mean a mutation
 * invalidating a cache nobody is reading from.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
