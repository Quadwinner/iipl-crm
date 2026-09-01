import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Skeleton } from '@itoby/ui'
import { canAccessRoute, homeRouteForRole, isAdminPortalRole } from '@/lib/navigation'
import { useAuth } from './use-auth'

export const WRONG_PORTAL_MESSAGE =
  'This account does not have access to the admin portal. Use the owner portal instead.'

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
 * Client-side gate only. Real enforcement is the RLS policies and RPC permission
 * checks in the database; this just keeps unreachable UI out of the way.
 */
export function ProtectedRoute() {
  const { status, role, signOut } = useAuth()
  const location = useLocation()
  const signedInWithWrongRole = status === 'authenticated' && !isAdminPortalRole(role)

  useEffect(() => {
    if (signedInWithWrongRole) void signOut()
  }, [signedInWithWrongRole, signOut])

  if (status === 'loading') return <SessionLoading />

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (signedInWithWrongRole) {
    return <Navigate to="/login" replace state={{ reason: WRONG_PORTAL_MESSAGE }} />
  }

  if (!canAccessRoute(role, location.pathname)) {
    return <Navigate to={homeRouteForRole(role)} replace />
  }

  return <Outlet />
}
