import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from './use-auth'

function SessionLoading() {
  return (
    <div className="mx-auto w-full max-w-md space-y-3 px-6 py-24" aria-busy="true">
      <span className="sr-only">Checking your session</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

/**
 * The superapp gate. Unlike the standalone portals this admits all three roles —
 * per-module access is decided by the module itself (and, authoritatively, by
 * RLS and require_permission() in the database).
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <SessionLoading />

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
