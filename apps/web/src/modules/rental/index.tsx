import { Navigate } from 'react-router-dom'

import { useAuth } from '@/auth/use-auth'
import { Skeleton } from '@itoby/ui'
import { AuthProvider as RentalAdminAuthProvider } from '@rental-admin/auth/auth-provider'
import { AppRoutes as RentalAdminRoutes } from '@rental-admin/routes'
import { AuthProvider as RentalOwnerAuthProvider } from '@rental-owner/auth/auth-provider'
import { OwnerRoutes as RentalOwnerRoutes } from '@rental-owner/routes'

function ModuleLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-6 py-16" aria-busy="true">
      <span className="sr-only">Opening IIPL Renting</span>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

/**
 * Mounts one of the two rental trees, each behind its OWN AuthProvider — both
 * resolve from the session the superapp already established.
 *
 * The role branch MUST happen before either provider renders. The owner
 * provider signs out any session that is not an active OFFICE_OWNER, so
 * mounting the owner tree for an administrator would silently end their
 * session rather than merely render the wrong screen.
 */
export function RentalModule() {
  const { status, role } = useAuth()

  if (status === 'loading') return <ModuleLoading />
  if (status === 'unauthenticated') return <Navigate to="/login" replace />

  if (role === 'OFFICE_OWNER') {
    return (
      <RentalOwnerAuthProvider>
        <RentalOwnerRoutes />
      </RentalOwnerAuthProvider>
    )
  }

  if (role === 'ADMINISTRATOR' || role === 'MAINTENANCE_STAFF') {
    return (
      <RentalAdminAuthProvider>
        <RentalAdminRoutes />
      </RentalAdminAuthProvider>
    )
  }

  // A signed-in session whose profile carries no usable role: send it back to
  // sign-in rather than guessing which tree to mount.
  return <Navigate to="/login" replace />
}
