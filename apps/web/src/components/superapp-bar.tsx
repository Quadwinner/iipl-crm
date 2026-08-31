import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, LayoutGrid, LogOut } from 'lucide-react'

import { useAuth } from '@/auth/use-auth'
import { useMyModules } from '@/features/modules/use-modules'
import { useSiteSettings } from '@/features/site/use-site-settings'
import { iconByName } from '@/lib/icons'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATOR: 'Administrator',
  MAINTENANCE_STAFF: 'Maintenance staff',
  OFFICE_OWNER: 'Office owner',
}

/**
 * The slim bar that sits above whichever module is open. Each module keeps its
 * own shell (the rental sidebar / owner header) untouched — this only adds the
 * Itoby mark, the module switcher and the user menu.
 */
export function SuperappBar() {
  const { role, email, signOut } = useAuth()
  const settings = useSiteSettings()
  const modules = useMyModules()
  const location = useLocation()
  const navigate = useNavigate()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const active = (modules.data ?? []).find(
    (m) => m.base_path && location.pathname.startsWith(m.base_path),
  )

  async function onSignOut() {
    setMenuOpen(false)
    await signOut()
    void navigate('/login', { replace: true })
  }

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="flex h-12 items-center gap-2 px-3 sm:px-4">
        <Link to="/app" className="flex items-center gap-2 rounded-md px-1 py-1">
          <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded text-[11px] font-semibold">
            IT
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            {settings.data?.company_name ?? ''}
          </span>
        </Link>

        <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden="true">
          /
        </span>

        {/* Module switcher */}
        <div className="relative">
          <button
            type="button"
            className="hover:bg-accent flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium"
            aria-expanded={switcherOpen}
            aria-haspopup="menu"
            onClick={() => {
              setSwitcherOpen((v) => !v)
              setMenuOpen(false)
            }}
          >
            {active?.name ?? 'All products'}
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </button>

          {switcherOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                onClick={() => setSwitcherOpen(false)}
              />
              <div
                role="menu"
                className="bg-popover absolute left-0 z-20 mt-1 w-72 rounded-lg border p-1 shadow-lg"
              >
                <Link
                  to="/app"
                  role="menuitem"
                  className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2 text-sm"
                  onClick={() => setSwitcherOpen(false)}
                >
                  <LayoutGrid className="size-4 opacity-70" aria-hidden="true" />
                  All products
                </Link>
                <div className="my-1 border-t" />
                {(modules.data ?? []).map((m) => {
                  const Icon = iconByName(m.icon)
                  const openable = m.status === 'ACTIVE' || m.status === 'BETA'
                  const isActive = active?.key === m.key
                  return (
                    <Link
                      key={m.key}
                      to={openable && m.base_path ? m.base_path : `/app/${m.key}`}
                      role="menuitem"
                      className="hover:bg-accent flex items-center gap-2.5 rounded-md px-2 py-2 text-sm"
                      onClick={() => setSwitcherOpen(false)}
                    >
                      <Icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                      <span className="flex-1 truncate">{m.name}</span>
                      {isActive ? (
                        <Check className="size-3.5 opacity-70" aria-hidden="true" />
                      ) : !openable ? (
                        <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </>
          ) : null}
        </div>

        {/* User menu */}
        <div className="relative ml-auto">
          <button
            type="button"
            className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => {
              setMenuOpen((v) => !v)
              setSwitcherOpen(false)
            }}
          >
            <span className="bg-muted flex size-6 items-center justify-center rounded-full text-[10px] font-semibold uppercase">
              {(email ?? '?').slice(0, 2)}
            </span>
            <span className="text-muted-foreground hidden max-w-[18rem] truncate md:inline">
              {email ?? ''}
            </span>
            <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
          </button>

          {menuOpen ? (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="bg-popover absolute right-0 z-20 mt-1 w-64 rounded-lg border p-1 shadow-lg"
              >
                <div className="px-2 py-2">
                  <p className="truncate text-sm font-medium">{email ?? ''}</p>
                  <p className="text-muted-foreground text-xs">
                    {role ? (ROLE_LABELS[role] ?? role) : ''}
                  </p>
                </div>
                <div className="my-1 border-t" />
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    'hover:bg-accent flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-sm',
                  )}
                  onClick={() => void onSignOut()}
                >
                  <LogOut className="size-4 opacity-70" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
