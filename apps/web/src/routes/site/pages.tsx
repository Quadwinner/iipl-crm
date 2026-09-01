import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

import { usePublicModules } from '@/features/modules/use-modules'
import { useIndustries, useServices } from '@/features/site/use-content'
import { useSiteSettings } from '@/features/site/use-site-settings'
import { iconByName } from '@/lib/icons'
import { useReveal } from '@/lib/use-reveal'
import { LeadForm } from './lead-form'
import { PageHero, SiteLayout } from './site-layout'

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

/** Shown where a table is genuinely empty. Honest beats invented. */
function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-12 text-center">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color:var(--fg-2)]">{body}</p>
      <Link
        to="/contact"
        className="text-[color:var(--ink)] mt-7 inline-flex items-center gap-2 rounded-lg bg-[color:var(--lime)] px-6 py-3 text-sm font-semibold"
      >
        Get in touch <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

/* ── About ────────────────────────────────────────────────────────────────── */

export function AboutPage() {
  const settings = useSiteSettings()
  const s = settings.data
  const steps = asArray<{ step: string; title: string; body: string }>(s?.process)
  const stats = asArray<{ value: string; suffix: string; label: string }>(s?.stats)
  useReveal([steps.length, stats.length])

  return (
    <SiteLayout>
      <PageHero
        eyebrow="About"
        title={<>An engineering team, <span className="text-[color:var(--fg-2)]">not an agency roster.</span></>}
        lead={s?.intro ?? ''}
      />

      <section className="border-b border-[color:var(--line)]">
        <div className="mx-auto grid w-full max-w-7xl gap-x-8 gap-y-10 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="rv">
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {st.value}
                <span className="text-[color:var(--lime)]">{st.suffix}</span>
              </p>
              <p className="mt-2 text-sm text-[color:var(--fg-2)]">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto w-full max-w-7xl px-6 py-24">
          <p className="eyebrow rv">How we work</p>
          <h2 className="rv mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Four steps, no surprises.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-4 md:gap-8">
            {steps.map((st, i) => (
              <div key={st.step} className="rv" style={{ ['--d' as string]: `${i * 100}ms` }}>
                <p className="num text-5xl font-semibold text-[color:var(--lime)]/25">{st.step}</p>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{st.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-2)]">{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

/* ── Services ─────────────────────────────────────────────────────────────── */

export function ServicesPage() {
  const services = useServices()
  const list = services.data ?? []
  useReveal([list.length])

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Services"
        title={<>Engineering that ships, <span className="text-[color:var(--fg-2)]">not decks.</span></>}
        lead="Web, mobile, custom software, SaaS platforms, AI systems and the marketing that fills them."
      />
      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-20 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s, i) => {
            const Icon = iconByName(s.icon)
            return (
              <Link
                key={s.slug}
                to={`/services/${s.slug}`}
                className="card rv flex flex-col p-7"
                style={{ ['--d' as string]: `${(i % 3) * 80}ms` }}
              >
                <Icon className="size-6 text-[color:var(--lime)]" aria-hidden="true" />
                <h2 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h2>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-[color:var(--fg-2)]">{s.summary}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--lime)]">
                  Learn more <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </SiteLayout>
  )
}

export function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const services = useServices()
  const list = services.data ?? []
  const s = list.find((x) => x.slug === slug)
  useReveal([list.length, slug])

  if (services.isPending) {
    return <SiteLayout><div className="mx-auto max-w-7xl px-6 py-32" aria-busy="true" /></SiteLayout>
  }
  if (!s) {
    return (
      <SiteLayout>
        <PageHero eyebrow="Services" title="Service not found" />
        <div className="mx-auto max-w-7xl px-6 py-20">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-[color:var(--lime)]">
            <ArrowLeft className="size-4" aria-hidden="true" /> All services
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const Icon = iconByName(s.icon)
  const highlights = asArray<string>(s.highlights)
  const others = list.filter((x) => x.slug !== s.slug).slice(0, 3)

  return (
    <SiteLayout>
      <PageHero eyebrow={s.category || 'Service'} title={s.title} lead={s.summary} />

      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div>
            <Icon className="size-8 text-[color:var(--lime)]" aria-hidden="true" />
            {s.body ? (
              <p className="rv mt-8 leading-relaxed whitespace-pre-line text-[color:var(--fg-2)]">{s.body}</p>
            ) : null}
            {highlights.length ? (
              <>
                <h2 className="rv mt-10 text-2xl font-semibold tracking-tight">What that includes</h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {highlights.map((h, i) => (
                    <li
                      key={h}
                      className="card rv flex gap-3 p-4 text-sm leading-relaxed"
                      style={{ ['--d' as string]: `${(i % 2) * 70}ms` }}
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[color:var(--lime)]" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>

          <aside className="rv">
            <div className="card p-7">
              <h2 className="text-lg font-semibold tracking-tight">Start this project</h2>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">
                Tell us the shape of it and we will come back with scope, cost and timeline.
              </p>
              <Link
                to="/request-quote"
                className="text-[color:var(--ink)] mt-6 inline-flex items-center gap-2 rounded-lg bg-[color:var(--lime)] px-6 py-3 text-sm font-semibold"
              >
                Request a quote <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            {others.length ? (
              <div className="mt-6">
                <p className="eyebrow">Other services</p>
                <ul className="mt-4 space-y-2.5">
                  {others.map((o) => (
                    <li key={o.slug}>
                      <Link
                        to={`/services/${o.slug}`}
                        className="text-sm text-[color:var(--fg-2)] transition-colors hover:text-[color:var(--fg)]"
                      >
                        {o.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </SiteLayout>
  )
}

/* ── Industries ───────────────────────────────────────────────────────────── */

export function IndustriesPage() {
  const industries = useIndustries()
  const list = industries.data ?? []
  useReveal([list.length])

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Industries"
        title="Domains we already know."
        lead="Sector knowledge means fewer discovery cycles and fewer wrong assumptions baked into the build."
      />
      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-20 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((n, i) => {
            const Icon = iconByName(n.icon)
            return (
              <article key={n.slug} className="card rv p-7" style={{ ['--c' as string]: 'var(--cyan)', ['--d' as string]: `${(i % 3) * 80}ms` }}>
                <Icon className="size-6 text-[color:var(--cyan)]" aria-hidden="true" />
                <h2 className="mt-6 text-lg font-semibold tracking-tight">{n.name}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--fg-2)]">{n.summary}</p>
              </article>
            )
          })}
        </div>
      </section>
    </SiteLayout>
  )
}

/* ── Products ─────────────────────────────────────────────────────────────── */

export function ProductsPage() {
  const modules = usePublicModules()
  const list = modules.data ?? []
  useReveal([list.length])

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Our SaaS"
        title={<>Products we run, <span className="text-[color:var(--fg-2)]">not just build.</span></>}
        lead="Five platforms under the IIPL name, on one account."
      />
      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-20 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m, i) => {
            const Icon = iconByName(m.icon)
            const live = (m.status === 'ACTIVE' || m.status === 'BETA') && !!m.base_path
            const features = asArray<string>(m.features)
            const inner = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-xl" style={{ background: `${m.accent}1f`, color: m.accent }}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="eyebrow flex items-center gap-2 !text-[10px]">
                    {live ? <span className="dot inline-block size-1.5 rounded-full" style={{ background: m.accent }} aria-hidden="true" /> : null}
                    {live ? 'Live' : 'Coming soon'}
                  </span>
                </div>
                <h2 className="mt-6 text-xl font-semibold tracking-tight">{m.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">{m.tagline}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[color:var(--fg-2)]/80">{m.summary}</p>
                {features.length ? (
                  <ul className="mt-5 space-y-2">
                    {features.map((f) => (
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
            const style = { ['--c' as string]: m.accent, ['--d' as string]: `${(i % 3) * 80}ms` }
            return live ? (
              <Link key={m.key} to={m.base_path!} className={cls} style={style}>{inner}</Link>
            ) : (
              <div key={m.key} className={cls} style={style}>{inner}</div>
            )
          })}
        </div>
      </section>
    </SiteLayout>
  )
}

/* ── Portfolio & Blog (content tables ship empty) ─────────────────────────── */

export function PortfolioPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Work" title="Selected work." lead="Case studies are being written up." />
      <section>
        <div className="mx-auto w-full max-w-3xl px-6 py-20">
          <Empty
            title="No case studies published yet"
            body="Work is added here from the content manager as each client approves it being shown. In the meantime we are happy to walk you through relevant projects on a call."
          />
        </div>
      </section>
    </SiteLayout>
  )
}

export function BlogPage() {
  return (
    <SiteLayout>
      <PageHero eyebrow="Blog" title="Notes from the build." lead="Engineering write-ups on what we ship." />
      <section>
        <div className="mx-auto w-full max-w-3xl px-6 py-20">
          <Empty
            title="No posts yet"
            body="Articles are published from the content manager. Nothing here is auto-generated, so this stays empty until something worth reading is written."
          />
        </div>
      </section>
    </SiteLayout>
  )
}

/* ── Contact & Quote ──────────────────────────────────────────────────────── */

export function ContactPage() {
  const settings = useSiteSettings()
  const s = settings.data
  useReveal([s?.id])

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Contact"
        title="Tell us what you are building."
        lead="A short call is usually enough to tell you whether we are the right fit, roughly what it costs and how long it takes."
      />
      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
          <div className="rv space-y-8">
            {[
              { k: 'Email', v: s?.email, href: s?.email ? `mailto:${s.email}` : undefined },
              { k: 'Phone', v: s?.phone, href: s?.phone ? `tel:${s.phone.replace(/\s/g, '')}` : undefined },
              { k: 'Office', v: s?.address },
              { k: 'Hours', v: s?.business_hours },
            ]
              .filter((r) => r.v)
              .map((r) => (
                <div key={r.k}>
                  <p className="eyebrow !text-[10px]">{r.k}</p>
                  <p className="mt-2 text-lg">
                    {r.href ? (
                      <a href={r.href} className="transition-colors hover:text-[color:var(--lime)]">{r.v}</a>
                    ) : (
                      r.v
                    )}
                  </p>
                </div>
              ))}
          </div>
          <div className="rv">
            <LeadForm source="CONTACT_FORM" cta="Send message" />
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}

export function QuotePage() {
  useReveal([])
  return (
    <SiteLayout>
      <PageHero
        eyebrow="Request a quote"
        title="Scope, cost and timeline."
        lead="The more you can tell us about the shape of the project, the more useful our first reply will be."
      />
      <section>
        <div className="mx-auto w-full max-w-3xl px-6 py-20">
          <div className="rv">
            <LeadForm source="QUOTE_REQUEST" cta="Request a quote" />
          </div>
        </div>
      </section>
    </SiteLayout>
  )
}
