import type { Role } from '@itoby/shared'
import {
  Building2,
  FolderOpen,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

/** Roles that may sign in to the Admin_Portal at all (Requirement 5.1). */
export const ADMIN_PORTAL_ROLES = ['ADMINISTRATOR', 'MAINTENANCE_STAFF'] as const
export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number]

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  roles: readonly Role[]
}

const ALL_STAFF: readonly Role[] = ADMIN_PORTAL_ROLES
const ADMIN_ONLY: readonly Role[] = ['ADMINISTRATOR']

/**
 * Maintenance_Staff is limited to the complaint workflow (Requirements 5.3, 5.4);
 * every other area is Administrator-only.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ALL_STAFF },
  { to: '/units', label: 'Office units', icon: Building2, roles: ADMIN_ONLY },
  { to: '/allotments', label: 'Allotments', icon: Handshake, roles: ADMIN_ONLY },
  { to: '/owners', label: 'Office owners', icon: Users, roles: ADMIN_ONLY },
  { to: '/complaints', label: 'Complaints', icon: Wrench, roles: ALL_STAFF },
  { to: '/billing', label: 'Billing', icon: IndianRupee, roles: ADMIN_ONLY },
  { to: '/documents', label: 'Documents', icon: FolderOpen, roles: ADMIN_ONLY },
  { to: '/audit', label: 'Audit log', icon: ScrollText, roles: ADMIN_ONLY },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ADMIN_ONLY },
]

export const ROLE_LABELS: Record<Role, string> = {
  ADMINISTRATOR: 'Administrator',
  MAINTENANCE_STAFF: 'Maintenance staff',
  OFFICE_OWNER: 'Office owner',
}

export function isAdminPortalRole(role: Role | null): role is AdminPortalRole {
  return role !== null && (ADMIN_PORTAL_ROLES as readonly Role[]).includes(role)
}

export function navItemsForRole(role: Role | null): NavItem[] {
  if (role === null) return []
  return NAV_ITEMS.filter((item) => item.roles.includes(role))
}

/** Matches a pathname to its nav section, including nested paths like `/units/new`. */
export function navItemForPath(path: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => path === item.to || path.startsWith(`${item.to}/`))
}

export function canAccessRoute(role: Role | null, path: string): boolean {
  const item = navItemForPath(path)
  return item !== undefined && role !== null && item.roles.includes(role)
}

/** Landing route after sign-in, and the fallback when a route is out of reach. */
export function homeRouteForRole(role: Role | null): string {
  return navItemsForRole(role)[0]?.to ?? '/login'
}
