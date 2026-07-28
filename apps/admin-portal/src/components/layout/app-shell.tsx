import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Building2, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/use-auth'
import { unlockBodyScroll } from '@/lib/scroll-lock'
import { cn } from '@/lib/utils'
import { navItemForPath, navItemsForRole, ROLE_LABELS } from '@/lib/navigation'

export function AppShell() {
  const { email, role, signOut } = useAuth()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    unlockBodyScroll()
  }, [location.pathname])

  const items = navItemsForRole(role)
  const section = navItemForPath(location.pathname)

  return (
    <div className="min-h-svh md:grid md:grid-cols-[15rem_1fr]">
      <a
        href="#main"
        className="focus-visible:ring-ring sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:ring-[3px]"
      >
        Skip to content
      </a>

      <aside
        id="app-nav"
        className={cn(
          'bg-sidebar text-sidebar-foreground border-sidebar-border border-b md:border-r md:border-b-0',
          'md:sticky md:top-0 md:h-svh md:overflow-y-auto',
          navOpen ? 'block' : 'hidden md:block',
        )}
      >
        <nav aria-label="Sections" className="flex flex-col gap-5 px-3 py-5">
          <div className="flex items-center gap-2.5 px-2">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm">
              <Building2 className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">IIPL</p>
              <p className="text-sidebar-foreground/70 text-xs">Office rentals CRM</p>
            </div>
          </div>
          <ul className="flex flex-col gap-0.5">
            {items.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'focus-visible:ring-sidebar-ring flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-[3px]',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                        : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-svh min-w-0 flex-col md:h-svh md:overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card/60 px-4 backdrop-blur-sm md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-expanded={navOpen}
            aria-controls="app-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            <Menu aria-hidden="true" />
            <span className="sr-only">{navOpen ? 'Hide sections' : 'Show sections'}</span>
          </Button>

          <span className="text-muted-foreground truncate text-sm">
            {section?.label ?? 'Admin'}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-muted-foreground hidden truncate text-sm sm:inline">
              {email}
              {role ? ` · ${ROLE_LABELS[role]}` : ''}
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </header>

        <main
          id="main"
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6 md:py-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
