import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/use-auth'

const NAV_ITEMS = [
  { to: '/invoices', label: 'Invoices' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/documents', label: 'Documents' },
  { to: '/profile', label: 'Profile' },
] as const

export function AppShell() {
  const { owner, signOut } = useAuth()

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="focus-visible:ring-ring bg-background sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:border focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:ring-[3px]"
      >
        Skip to content
      </a>

      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <p className="text-sm font-semibold tracking-tight">IIPL office rentals</p>
          <div className="flex items-center gap-3">
            {owner ? (
              <span className="text-muted-foreground max-w-[16rem] truncate text-sm">
                {owner.name}
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>

        <nav aria-label="Portal sections" className="mx-auto w-full max-w-5xl px-4">
          <ul className="-mb-px flex gap-4 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'focus-visible:ring-ring inline-flex h-9 items-center border-b-2 text-sm transition-colors focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:outline-none',
                      isActive
                        ? 'border-foreground text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground border-transparent',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
