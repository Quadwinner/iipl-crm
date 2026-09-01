import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { Inbox, Settings2 } from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { Skeleton } from '@itoby/ui'
import { cn } from '@/lib/utils'

const TABS = [
  { to: '/app/admin/leads', label: 'Leads', icon: Inbox },
  { to: '/app/admin/content', label: 'Site content', icon: Settings2 },
]

/**
 * ADMINISTRATOR-only area. This is a client-side gate for the UI only — the
 * real enforcement is the LEAD_READ / LEAD_MANAGE permission checks and the
 * *_write_admin RLS policies in the database.
 */
export function AdminShell() {
  const { status, role } = useAuth()

  if (status === 'loading') {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <Skeleton className="h-8 w-48" />
      </div>
    )
  }
  if (role !== 'ADMINISTRATOR') return <Navigate to="/app" replace />

  return (
    <div>
      <nav className="bg-muted/30 border-b" aria-label="Admin sections">
        <div className="mx-auto flex w-full max-w-5xl gap-1 px-6">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'text-muted-foreground hover:text-foreground border-transparent',
                )
              }
            >
              <t.icon className="size-4" aria-hidden="true" />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
