import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'

import { useSiteSettings } from '@/features/site/use-site-settings'
import '../home-page.css'

const NAV = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/products', label: 'Products' },
  { to: '/industries', label: 'Industries' },
  { to: '/portfolio', label: 'Work' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
]

export function SiteNav({ company }: { company: string }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const panelRef = useRef<HTMLDivElement>(null)

  // Any navigation closes the menu — otherwise it stays open over the new page.
  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    // Focus moves into the panel so a keyboard user is not left behind the
    // trigger, and the page underneath cannot be scrolled past.
    panelRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [open])

  return (
    <>
      {/*
        The nav was xl:flex only, so every phone and tablet had no navigation at
        all beyond Sign in — on a site whose visitors are mostly on phones.
      */}
      <a
        href="#main"
        className="text-[color:var(--ink)] sr-only rounded-lg bg-[color:var(--lime)] px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to content
      </a>

      <header className="relative z-20 mx-auto flex h-20 w-full max-w-7xl items-center gap-3 px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-[color:var(--ink)] flex size-8 items-center justify-center rounded-lg bg-[color:var(--lime)] text-[11px] font-bold">
            IT
          </span>
          <span className="font-semibold tracking-tight">{company}</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-7 text-sm text-[color:var(--fg-2)] xl:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `transition-colors hover:text-[color:var(--fg)] ${isActive ? 'text-[color:var(--fg)]' : ''}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <Link
          to="/login"
          className="text-[color:var(--ink)] ml-auto rounded-lg bg-[color:var(--lime)] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03] xl:ml-6"
        >
          Sign in
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="site-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          className="ml-1 rounded-lg border border-[color:var(--line)] p-2.5 xl:hidden"
        >
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </header>

      {open ? (
        <div
          id="site-menu"
          ref={panelRef}
          tabIndex={-1}
          className="fixed inset-0 z-30 bg-[color:var(--ink)] px-6 pt-24 outline-none xl:hidden"
        >
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `border-b border-[color:var(--line)] py-4 text-lg transition-colors ${
                    isActive ? 'text-[color:var(--lime)]' : 'text-[color:var(--fg)]'
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/request-quote" className="py-4 text-lg text-[color:var(--fg-2)]">
              Request a quote
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  )
}

export function SiteFooter() {
  const settings = useSiteSettings()
  const s = settings.data
  const socials = (s?.socials ?? {}) as Record<string, string>

  return (
    <footer className="border-t border-[color:var(--line)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow">Company</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[color:var(--fg-2)]">
              {NAV.slice(0, 4).map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="transition-colors hover:text-[color:var(--fg)]">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">More</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[color:var(--fg-2)]">
              {NAV.slice(4).map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="transition-colors hover:text-[color:var(--fg)]">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/request-quote" className="transition-colors hover:text-[color:var(--fg)]">
                  Request a quote
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Reach us</p>
            <ul className="mt-4 space-y-2.5 text-sm text-[color:var(--fg-2)]">
              {s?.email ? (
                <li>
                  <a href={`mailto:${s.email}`} className="transition-colors hover:text-[color:var(--fg)]">
                    {s.email}
                  </a>
                </li>
              ) : null}
              {s?.phone ? (
                <li>
                  <a href={`tel:${s.phone.replace(/\s/g, '')}`} className="transition-colors hover:text-[color:var(--fg)]">
                    {s.phone}
                  </a>
                </li>
              ) : null}
              {s?.address ? <li>{s.address}</li> : null}
              {s?.business_hours ? <li>{s.business_hours}</li> : null}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Start a project</p>
            <p className="mt-4 text-sm leading-relaxed text-[color:var(--fg-2)]">
              Tell us what you are building and we will come back with scope, cost and timeline.
            </p>
            <Link
              to="/request-quote"
              className="group text-[color:var(--ink)] mt-5 inline-flex items-center gap-2 rounded-lg bg-[color:var(--lime)] px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
            >
              Request a quote
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[color:var(--line)] pt-8 text-sm text-[color:var(--fg-2)] sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} {s?.company_name ?? ''}</span>
          {/* Play Store review checks the privacy policy is reachable from the
              site itself, not only from the listing. */}
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/privacy" className="transition-colors hover:text-[color:var(--fg)]">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-[color:var(--fg)]">
              Terms
            </Link>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-auto">
            {Object.entries(socials).map(([k, url]) => (
              <a
                key={k}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="capitalize transition-colors hover:text-[color:var(--fg)]"
              >
                {k}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

/** Chrome shared by every public page except the home, which builds its own hero. */
export function SiteLayout({ children }: { children: ReactNode }) {
  const settings = useSiteSettings()
  return (
    <div className="itoby min-h-svh">
      <SiteNav company={settings.data?.company_name ?? ''} />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  )
}

/** Page header used across the inner pages. */
export function PageHero({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string
  title: ReactNode
  lead?: string
}) {
  return (
    <section className="aura border-b border-[color:var(--line)]">
      <div className="relative mx-auto w-full max-w-7xl px-6 py-20 sm:py-28">
        <p className="eyebrow up">{eyebrow}</p>
        <h1
          className="up mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-6xl"
          style={{ ['--d' as string]: '120ms' }}
        >
          {title}
        </h1>
        {lead ? (
          <p
            className="up mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--fg-2)]"
            style={{ ['--d' as string]: '240ms' }}
          >
            {lead}
          </p>
        ) : null}
      </div>
    </section>
  )
}
