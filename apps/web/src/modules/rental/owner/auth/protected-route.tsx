import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { Skeleton } from '@rental-owner/components/ui/skeleton'
import { useAuth } from './use-auth'

export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10" aria-busy="true" aria-live="polite">
        <span className="sr-only">Checking your session</span>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
