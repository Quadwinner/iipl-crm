import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'

import { Skeleton } from '@itoby/ui'
import { usePublicModules, type AppModule } from '@/features/modules/use-modules'
import { useSiteSettings } from '@/features/site/use-site-settings'
import { iconByName } from '@/lib/icons'
import { useReveal } from '@/lib/use-reveal'
import { DashboardPreview } from './home-preview'
import { Capabilities, ClosingBand, Flow, Marker, Roles, Trust } from './home-sections'
import './home-page.css'

const MARKETING_SITE = 'https://itobyinfotech.com'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Live',
  BETA: 'Beta',
  COMING_SOON: 'Coming soon',
  DISABLED: 'Unavailable',
}

/** Splits a headline so each word can rise from behind its own line box. */
function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span className="word" key={`${w}-${i}`}>
          <span style={{ ['--d' as string]: `${from + i * 70}ms` }}>{w}</span>
          {i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  )
}

function ProductCard({ m, i }: { m: AppModule; i: number }) {
  const Icon = iconByName(m.icon)
  const live = (m.status === 'ACTIVE' || m.status === 'BETA') && !!m.base_path
  const features = Array.isArray(m.features) ? (m.features as string[]) : []

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${m.accent}14`, color: m.accent }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.12em] uppercase">
          {live ? (
            <span
              className="pulse inline-block size-1.5 rounded-full"
              style={{ background: m.accent }}
              aria-hidden="true"
            />
          ) : null}
          {STATUS_LABEL[m.status] ?? ''}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold tracking-tight">{m.name}</h3>
      <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{m.tagline}</p>

      {features.length ? (
        <ul className="mt-4 space-y-1.5">
          {features.slice(0, 3).map((f) => (
            <li key={f} className="text-muted-foreground/90 flex gap-2 text-xs leading-relaxed">
              <Check className="mt-[3px] size-3 shrink-0" style={{ color: m.accent }} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-5">
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: m.accent }}>
            Open <ArrowRight className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Not available yet</span>
        )}
      </div>
    </>
  )

  const cls =
    'pcard reveal surface-card flex min-h-[17rem] flex-col p-6' + (live ? ' pcard-live' : ' opacity-90')

  return live ? (
    <Link
      to={m.base_path!}
      className={cls}
      style={{ ['--accent' as string]: m.accent, ['--d' as string]: `${i * 90}ms` }}
    >
      {body}
    </Link>
  ) : (
    <div className={cls} style={{ ['--accent' as string]: m.accent, ['--d' as string]: `${i * 90}ms` }}>
      {body}
    </div>
  )
}

/**
 * The superapp's front door.
 *
 * Deliberately not a marketing page — itobyinfotech.com owns the company story.
 * This says which workspace you have landed on, what is inside it, and gets you
 * signed in. Every string comes from site_settings or app_modules, so it stays
 * editable from the CMS with no redeploy.
 */
export function HomePage() {
  const settings = useSiteSettings()
  const modules = usePublicModules()

  const company = settings.data?.company_name ?? ''
  const list = modules.data ?? []
  // Cards render only after the query resolves — re-observe when they appear.
  useReveal([list.length])
  const liveCount = list.filter((m) => m.status === 'ACTIVE' || m.status === 'BETA').length

  return (
    <div className="home min-h-svh">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="home-hero">
        <div className="home-grid" aria-hidden="true" />

        <header className="relative mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-6">
          <span className="flex size-7 items-center justify-center rounded bg-white/12 text-[11px] font-semibold backdrop-blur">
            IT
          </span>
          <span className="font-semibold tracking-tight">{company}</span>
          <a
            href={MARKETING_SITE}
            className="ml-auto hidden items-center gap-1 text-sm text-white/65 transition-colors hover:text-white sm:flex"
          >
            Company site
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
          <Link
            to="/login"
            className="ml-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[color:var(--ink)] transition-transform hover:scale-[1.02]"
          >
            Sign in
          </Link>
        </header>

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-16 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:pt-20 lg:pb-28">
          <div>
          <p
            className="rise font-mono text-[11px] tracking-[0.22em] text-white/50 uppercase"
            style={{ ['--d' as string]: '80ms' }}
          >
            {company} · Workspace
          </p>

          <h1 className="mt-6 max-w-4xl text-[2.75rem] leading-[1.04] font-semibold tracking-tight text-balance sm:text-6xl">
            <Words text="One sign-in for" from={240} />
            <br />
            <span className="text-white/45">
              <Words text="every IIPL product." from={520} />
            </span>
          </h1>

          {settings.data?.intro ? (
            <p
              className="rise mt-7 max-w-2xl leading-relaxed text-white/70"
              style={{ ['--d' as string]: '820ms' }}
            >
              {settings.data.intro}
            </p>
          ) : (
            <Skeleton className="mt-7 h-16 w-full max-w-2xl bg-white/10" />
          )}

          <div className="rise mt-10 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '960ms' }}>
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium text-[color:var(--ink)] transition-transform hover:scale-[1.02]"
            >
              Sign in to your workspace
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <a
              href={MARKETING_SITE}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
            >
              About Itoby Infotech
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
            </div>
          </div>

          {/* The product itself, not a stock illustration. */}
          <div className="frame-float relative hidden lg:block" aria-hidden="true">
            <DashboardPreview />
          </div>
        </div>

        {/* Module ticker — the suite, always moving, pauses on hover. */}
        {list.length ? (
          <div className="relative overflow-hidden border-t border-white/10 py-4">
            <div className="ticker">
              {[0, 1].map((pass) => (
                <div key={pass} className="flex shrink-0" aria-hidden={pass === 1}>
                  {list.map((m) => (
                    <span
                      key={`${pass}-${m.key}`}
                      className="flex items-center gap-2.5 px-8 font-mono text-xs tracking-[0.14em] whitespace-nowrap text-white/40 uppercase"
                    >
                      <span
                        className="inline-block size-1.5 rounded-full"
                        style={{ background: m.accent }}
                        aria-hidden="true"
                      />
                      {m.name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Products ───────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
        <Marker n="00">The suite</Marker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="reveal text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Five products, one account.
            </h2>
          </div>
          <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
            {liveCount === 1
              ? 'One is shipping today. Sign in to open whichever your account has access to.'
              : `${liveCount} are shipping today. Sign in to open whichever your account has access to.`}
          </p>
        </div>

        {modules.isPending ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[17rem] w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((m, i) => (
              <ProductCard key={m.key} m={m} i={i} />
            ))}
          </div>
        )}
      </section>

      <Capabilities />
      <Roles />
      <Flow />
      <Trust />
      <ClosingBand marketingSite={MARKETING_SITE} />

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-10 text-sm sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {settings.data?.email ? (
              <a href={`mailto:${settings.data.email}`} className="hover:text-foreground transition-colors">
                {settings.data.email}
              </a>
            ) : null}
            {settings.data?.phone ? (
              <a
                href={`tel:${settings.data.phone.replace(/\s/g, '')}`}
                className="hover:text-foreground transition-colors"
              >
                {settings.data.phone}
              </a>
            ) : null}
            {settings.data?.address ? <span>{settings.data.address}</span> : null}
          </div>
          <a href={MARKETING_SITE} className="hover:text-foreground transition-colors sm:ml-auto">
            itobyinfotech.com
          </a>
        </div>
      </footer>
    </div>
  )
}
