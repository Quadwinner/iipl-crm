import type { Role } from '@itoby/shared'

/**
 * Every role signs in at the same /login. This decides where each one lands.
 * Unlike the standalone portals there is no "wrong portal" case here — the
 * superapp admits all three roles and routes them to their own surface.
 */
export function homeRouteForRole(role: Role | null): string {
  switch (role) {
    case 'ADMINISTRATOR':
    case 'MAINTENANCE_STAFF':
      return '/app/rental/dashboard'
    case 'OFFICE_OWNER':
      return '/app/rental/home'
    default:
      return '/login'
  }
}

/** Roles that may hold a session in the superapp: all of them. */
export function isKnownRole(role: Role | null): role is Role {
  return role === 'ADMINISTRATOR' || role === 'MAINTENANCE_STAFF' || role === 'OFFICE_OWNER'
}
