import { Link, NavLink, Outlet } from 'react-router-dom'
import { Bell, Building2, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/use-auth'
import { useOwnerReminders } from '@/features/notifications/api'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/home', label: 'Home' },
  { to: '/lease', label: 'My lease' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/reminders', label: 'Reminders' },
  { to: '/receipts', label: 'Receipts' },
  { to: '/complaints', label: 'Complaints' },
  { to: '/documents', label: 'Documents' },
  { to: '/profile', label: 'Profile' },
] as const

export function AppShell() {
  const { owner, signOut } = useAuth()
  const reminders = useOwnerReminders()
  const reminderCount = reminders.data?.length ?? 0

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="focus-visible:ring-ring bg-background sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:border focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:ring-[3px]"
      >
        Skip to content
      </a>

      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
              aria-hidden="true"
            >
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">IIPL</p>
              <p className="text-muted-foreground text-xs">Owner portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {owner ? (
              <div className="hidden text-right sm:block">
                <p className="max-w-[14rem] truncate text-sm font-medium">{owner.name}</p>
                <p className="text-muted-foreground text-xs">Office tenant</p>
              </div>
            ) : null}
            <Button type="button" variant="outline" size="sm" asChild>
              <Link to="/reminders" aria-label={`Reminders${reminderCount ? `, ${reminderCount}` : ''}`}>
                <Bell aria-hidden="true" />
                <span className="hidden sm:inline">Reminders</span>
                {reminderCount > 0 ? (
                  <span className="bg-primary text-primary-foreground ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[0.65rem] font-semibold tabular-nums">
                    {reminderCount > 9 ? '9+' : reminderCount}
                  </span>
                ) : null}
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>

        <nav
          aria-label="Portal sections"
          className="border-t bg-muted/30 px-4 pb-3 sm:px-6"
        >
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto pt-2 sm:gap-1.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="shrink-0">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'focus-visible:ring-ring inline-flex h-8 items-center rounded-full px-3.5 text-sm whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-none sm:h-9 sm:px-4',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'text-muted-foreground hover:bg-card hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t bg-card/50 py-4">
        <p className="text-muted-foreground mx-auto max-w-6xl px-4 text-center text-xs sm:px-6">
          IIPL Office Rentals · Tenant self-service portal
        </p>
      </footer>
    </div>
  )
}
