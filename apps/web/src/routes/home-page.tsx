import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Mail, MapPin, Phone } from 'lucide-react'

import { usePublicModules, type AppModule } from '@/features/modules/use-modules'
import { useIndustries, useServices } from '@/features/site/use-content'
import { useSiteSettings } from '@/features/site/use-site-settings'
import { iconByName } from '@/lib/icons'
import { useReveal } from '@/lib/use-reveal'
import { SiteFooter, SiteNav } from './site/site-layout'
import './home-page.css'

const ROTATING = ['Websites', 'Apps', 'SaaS', 'AI Agents']

type Stat = { value: string; suffix: string; label: string }
type Step = { step: string; title: string; body: string }

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */

function Hero({ intro, stats }: { intro: string; stats: Stat[] }) {
  return (
    <section className="aura">
      <div className="relative mx-auto w-full max-w-7xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <p className="eyebrow up" style={{ ['--d' as string]: '60ms' }}>
          Global digital engineering &amp; SaaS lab
        </p>

        <h1 className="mt-7 max-w-5xl text-[3rem] leading-[0.98] font-semibold tracking-[-0.035em] sm:text-[5rem] lg:text-[6.25rem]">
          <span className="clip">
            <span style={{ ['--d' as string]: '180ms' }}>We build</span>
          </span>
          <br />
          <span className="clip">
            <span style={{ ['--d' as string]: '320ms' }}>high-converting</span>
          </span>
          <br />
          {/* The rotor cycles the thing being built. */}
          <span className="rotor" aria-label={ROTATING.join(', ')}>
            {ROTATING.map((w, i) => (
              <span key={w} aria-hidden={i > 0} style={{ ['--i' as string]: `${i * 3}s` }}>
                {w}
              </span>
            ))}
          </span>
        </h1>

        <p
          className="up mt-9 max-w-2xl text-lg leading-relaxed text-[color:var(--fg-2)]"
          style={{ ['--d' as string]: '620ms' }}
        >
          {intro}
        </p>

        <div className="up mt-10 flex flex-wrap items-center gap-3" style={{ ['--d' as string]: '760ms' }}>
          <a
            href="#contact"
            className="group text-[color:var(--ink)] inline-flex items-center gap-2 rounded-lg bg-[color:var(--lime)] px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
          >
            Discuss your project
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <a
            href="#services"
            className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line)] px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Explore services
          </a>
        </div>

        {stats.length ? (
          <div className="up mt-20 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4" style={{ ['--d' as string]: '900ms' }}>
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {s.value}
                  <span className="text-[color:var(--lime)]">{s.suffix}</span>
                </p>
                <p className="mt-2 text-sm text-[color:var(--fg-2)]">{s.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

/* ── Services ─────────────────────────────────────────────────────────────── */

function Services() {
  const services = useServices()
  const list = services.data ?? []
  useReveal([list.length])

  return (
    <section id="services" className="border-t border-[color:var(--line)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <p className="eyebrow rv">What we do</p>
        <h2 className="rv mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Engineering that ships, <span className="text-[color:var(--fg-2)]">not decks.</span>
        </h2>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const Icon = iconByName(s.icon)
            const highlights = asArray<string>(s.highlights)
            return (
              <article
                key={s.slug}
                className="card rv p-7"
                style={{ ['--d' as string]: `${(i % 3) * 90}ms` }}
              >
                <Icon className="size-6 text-[color:var(--lime)]" aria-hidden="true" />
                <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-2)]">{s.summary}</p>
                {highlights.length ? (
                  <ul className="mt-5 space-y-2">
                    {highlights.slice(0, 4).map((h) => (
                      <li key={h} className="flex gap-2.5 text-xs leading-relaxed text-[color:var(--fg-2)]">
                        <Check className="mt-0.5 size-3 shrink-0 text-[color:var(--lime-dim)]" aria-hidden="true" />
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Products ─────────────────────────────────────────────────────────────── */

function ProductCard({ m, i }: { m: AppModule; i: number }) {
  const Icon = iconByName(m.icon)
  const live = (m.status === 'ACTIVE' || m.status === 'BETA') && !!m.base_path
  const features = asArray<string>(m.features)

  const inner = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          className="flex size-12 items-center justify-center rounded-xl"
          style={{ background: `${m.accent}1f`, color: m.accent }}
        >
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="eyebrow flex items-center gap-2 !text-[10px]">
          {live ? (
            <span className="dot inline-block size-1.5 rounded-full" style={{ background: m.accent }} aria-hidden="true" />
          ) : null}
          {live ? 'Live' : 'Coming soon'}
        </span>
      </div>
      <h3 className="mt-6 text-xl font-semibold tracking-tight">{m.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">{m.tagline}</p>
      <p className="mt-4 text-sm leading-relaxed text-[color:var(--fg-2)]/80">{m.summary}</p>
      {features.length ? (
        <ul className="mt-5 space-y-2">
          {features.slice(0, 3).map((f) => (
            <li key={f} className="flex gap-2.5 text-xs leading-relaxed text-[color:var(--fg-2)]">
              <Check className="mt-0.5 size-3 shrink-0" style={{ color: m.accent }} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-7">
        {live ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: m.accent }}>
            Open the platform <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        ) : (
          <span className="text-sm text-[color:var(--fg-2)]">In development</span>
        )}
      </div>
    </>
  )

  const cls = 'card rv flex flex-col p-7'
  const style = { ['--c' as string]: m.accent, ['--d' as string]: `${(i % 3) * 90}ms` }

  return live ? (
    <Link to={m.base_path!} className={cls} style={style}>{inner}</Link>
  ) : (
    <div className={cls} style={style}>{inner}</div>
  )
}

function Products({ list }: { list: AppModule[] }) {
  return (
    <section id="products" className="aura border-t border-[color:var(--line)]">
      <div className="relative mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <p className="eyebrow rv">Our SaaS</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="rv max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Products we run, <span className="text-[color:var(--fg-2)]">not just build.</span>
          </h2>
          <p className="rv max-w-sm text-sm leading-relaxed text-[color:var(--fg-2)]">
            Five platforms under the IIPL name. Sign in once and you are in whichever your account has access to.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m, i) => (
            <ProductCard key={m.key} m={m} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Industries ───────────────────────────────────────────────────────────── */

function Industries() {
  const industries = useIndustries()
  const list = industries.data ?? []
  useReveal([list.length])

  return (
    <section id="industries" className="border-t border-[color:var(--line)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <p className="eyebrow rv">Who we build for</p>
        <h2 className="rv mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Domains we already know.
        </h2>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-[color:var(--line)] bg-[color:var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {list.map((n, i) => {
            const Icon = iconByName(n.icon)
            return (
              <div
                key={n.slug}
                className="rv bg-[color:var(--ink)] p-7 transition-colors hover:bg-[color:var(--ink-2)]"
                style={{ ['--d' as string]: `${(i % 4) * 70}ms` }}
              >
                <Icon className="size-5 text-[color:var(--cyan)]" aria-hidden="true" />
                <h3 className="mt-5 font-semibold tracking-tight">{n.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--fg-2)]">{n.summary}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Process ──────────────────────────────────────────────────────────────── */

function Process({ steps }: { steps: Step[] }) {
  if (!steps.length) return null
  return (
    <section id="process" className="border-t border-[color:var(--line)]">
      <div className="mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <p className="eyebrow rv">How we work</p>
        <h2 className="rv mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Four steps, no surprises.
        </h2>

        <div className="mt-16 grid gap-12 md:grid-cols-4 md:gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="rv" style={{ ['--d' as string]: `${i * 110}ms` }}>
              <p className="num text-5xl font-semibold text-[color:var(--lime)]/25">{s.step}</p>
              <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-2)]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Contact ──────────────────────────────────────────────────────────────── */

function Contact({
  email,
  phone,
  address,
  hours,
}: {
  email: string
  phone: string
  address: string
  hours: string
}) {
  return (
    <section id="contact" className="aura border-t border-[color:var(--line)]">
      <div className="relative mx-auto w-full max-w-7xl px-6 py-24 sm:py-32">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div>
            <p className="eyebrow rv">Start a project</p>
            <h2 className="rv mt-5 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Tell us what you are building.
            </h2>
            <p className="rv mt-5 max-w-md leading-relaxed text-[color:var(--fg-2)]">
              A short call is usually enough to tell you whether we are the right fit, roughly what it
              costs, and how long it takes.
            </p>
            <div className="rv mt-9 flex flex-wrap gap-3">
              <a
                href={`mailto:${email}`}
                className="group text-[color:var(--ink)] inline-flex items-center gap-2 rounded-lg bg-[color:var(--lime)] px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.03]"
              >
                Email us
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </a>
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--line)] px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
              >
                Call {phone}
              </a>
            </div>
          </div>

          <dl className="rv card space-y-6 p-8">
            {[
              { icon: Mail, k: 'Email', v: email, href: `mailto:${email}` },
              { icon: Phone, k: 'Phone', v: phone, href: `tel:${phone.replace(/\s/g, '')}` },
              { icon: MapPin, k: 'Office', v: address },
            ].map((row) => (
              <div key={row.k} className="flex gap-4">
                <row.icon className="mt-0.5 size-4 shrink-0 text-[color:var(--lime)]" aria-hidden="true" />
                <div>
                  <dt className="eyebrow !text-[10px]">{row.k}</dt>
                  <dd className="mt-1 text-sm">
                    {row.href ? (
                      <a href={row.href} className="transition-colors hover:text-[color:var(--lime)]">
                        {row.v}
                      </a>
                    ) : (
                      row.v
                    )}
                  </dd>
                </div>
              </div>
            ))}
            {hours ? (
              <div className="border-t border-[color:var(--line)] pt-6 text-sm text-[color:var(--fg-2)]">
                {hours}
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export function HomePage() {
  const settings = useSiteSettings()
  const modules = usePublicModules()
  const list = modules.data ?? []
  useReveal([list.length, settings.data?.id])

  const s = settings.data
  const company = s?.company_name ?? ''
  const stats = asArray<Stat>(s?.stats)
  const steps = asArray<Step>(s?.process)

  return (
    <div className="itoby min-h-svh">
      <SiteNav company={company} />
      <Hero intro={s?.intro ?? ''} stats={stats} />

      {/* The suite, always moving. */}
      {list.length ? (
        <div className="overflow-hidden border-y border-[color:var(--line)] py-5">
          <div className="marq">
            {[0, 1].map((pass) => (
              <div key={pass} className="flex shrink-0" aria-hidden={pass === 1}>
                {list.map((m) => (
                  <span key={`${pass}-${m.key}`} className="eyebrow flex items-center gap-2.5 px-10 whitespace-nowrap">
                    <span className="inline-block size-1.5 rounded-full" style={{ background: m.accent }} aria-hidden="true" />
                    {m.name}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Services />
      <Products list={list} />
      <Industries />
      <Process steps={steps} />
      <Contact
        email={s?.email ?? ''}
        phone={s?.phone ?? ''}
        address={s?.address ?? ''}
        hours={s?.business_hours ?? ''}
      />

      <SiteFooter />
    </div>
  )
}
