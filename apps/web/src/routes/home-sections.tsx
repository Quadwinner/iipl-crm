import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CreditCard,
  FileText,
  FolderOpen,
  HardHat,
  IndianRupee,
  ReceiptIndianRupee,
  ScrollText,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'

/**
 * Sections of the superapp home page.
 *
 * Every claim here is true of the system as built — the capabilities map to
 * real RPCs and screens, the roles are the three in the `role` enum, and the
 * security notes describe the actual RLS + require_permission arrangement.
 * Nothing is aspirational and no client work or metrics are invented.
 */

export function Marker({ n, children }: { n: string; children: string }) {
  return (
    <p className="marker reveal">
      <span className="text-foreground/70 tabular-nums">{n}</span>
      {children}
    </p>
  )
}

/* ── 01 · What the workspace runs ─────────────────────────────────────────── */

const CAPABILITIES = [
  {
    icon: Building2,
    title: 'Units and occupancy',
    body: 'Buildings and office units with live occupancy. Allotting a unit and flipping it to occupied happen in one transaction, so the two can never disagree.',
  },
  {
    icon: IndianRupee,
    title: 'Billing that runs itself',
    body: 'Invoices generate on each lease’s own cycle — monthly, quarterly or yearly — with electricity and maintenance charges folded in and GST applied on the total.',
  },
  {
    icon: CreditCard,
    title: 'Rent collection',
    body: 'Owners pay by UPI or Razorpay from their portal. The gateway webhook is the only authority on the outcome, so a payment is never marked complete on the client’s word.',
  },
  {
    icon: ReceiptIndianRupee,
    title: 'Receipts on payment',
    body: 'A receipt is generated inside the same transaction that completes the payment and updates the invoice. No nightly job, no gap where money is taken but unreceipted.',
  },
  {
    icon: Wrench,
    title: 'Maintenance complaints',
    body: 'Owners raise issues with photos; staff assign, comment and resolve. Every status change and comment is kept as an event, so the thread reads as a history.',
  },
  {
    icon: FolderOpen,
    title: 'Documents and leases',
    body: 'Lease agreements and account documents, scoped so an owner only ever sees their own. Downloads go through short-lived links rather than public URLs.',
  },
  {
    icon: Wallet,
    title: 'Building expenses',
    body: 'Cleaning, guard salary, diesel, repairs — recorded per building and set against collections so the reporting reflects what a building actually costs to run.',
  },
  {
    icon: ScrollText,
    title: 'Append-only audit log',
    body: 'Every consequential write records who did what, to which record, and what changed. The table has no update or delete grant anywhere.',
  },
]

export function Capabilities() {
  return (
    <section className="tinted border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Marker n="01">The rental workspace</Marker>
        <h2 className="reveal mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Everything a leasing office does, in one place.
        </h2>
        <p className="reveal text-muted-foreground mt-4 max-w-xl leading-relaxed">
          IIPL Renting is the product shipping today. It covers the full cycle — from allotting a unit
          to the receipt that closes a payment.
        </p>

        <div className="mt-14 grid gap-px border-y bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c, i) => (
            <article
              key={c.title}
              className="tile reveal bg-background p-6"
              style={{ ['--d' as string]: `${(i % 4) * 70}ms` }}
            >
              <c.icon className="text-primary size-5" aria-hidden="true" />
              <h3 className="mt-4 font-semibold tracking-tight">{c.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{c.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 02 · Roles ───────────────────────────────────────────────────────────── */

const ROLES = [
  {
    icon: UserCog,
    accent: 'oklch(0.38 0.09 245)',
    name: 'Administrator',
    line: 'Runs the portfolio.',
    items: [
      'Buildings, units and allotments',
      'Billing, payments and expenses',
      'Tenant and staff accounts',
      'Reporting, exports and the audit log',
    ],
  },
  {
    icon: HardHat,
    accent: 'oklch(0.55 0.12 195)',
    name: 'Maintenance staff',
    line: 'Sees only the work.',
    items: [
      'Complaints assigned to them',
      'Status updates and comments',
      'Unit and building context',
      'No billing, no tenant records',
    ],
  },
  {
    icon: Users,
    accent: 'oklch(0.58 0.14 265)',
    name: 'Office owner',
    line: 'Their tenancy, nothing else.',
    items: [
      'Lease, invoices and receipts',
      'Pay rent by UPI or Razorpay',
      'Raise and follow complaints',
      'Documents shared with them',
    ],
  },
]

export function Roles() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Marker n="02">Access</Marker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Three roles, one sign-in.
          </h2>
          <p className="reveal text-muted-foreground max-w-sm text-sm leading-relaxed">
            What each person sees is decided in the database, not the interface — so a screen that
            should not load, cannot.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <div
              key={r.name}
              className="role reveal"
              style={{ ['--role-accent' as string]: r.accent, ['--d' as string]: `${i * 130}ms` }}
            >
              <r.icon className="size-5" style={{ color: r.accent }} aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{r.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">{r.line}</p>
              <ul className="mt-5 space-y-2.5">
                {r.items.map((it) => (
                  <li key={it} className="text-muted-foreground flex gap-2.5 text-sm leading-relaxed">
                    <span
                      className="mt-[0.5rem] size-1 shrink-0 rounded-full"
                      style={{ background: r.accent }}
                      aria-hidden="true"
                    />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 03 · Flow ────────────────────────────────────────────────────────────── */

const STEPS = [
  { n: '01', t: 'Allot a unit', b: 'Pick a vacant unit and an owner, set the rent and cycle. The lease is created and the unit flips to occupied together.' },
  { n: '02', t: 'Invoices generate', b: 'On each lease’s billing date, an invoice is raised with rent, electricity and maintenance, GST applied on the total.' },
  { n: '03', t: 'The owner pays', b: 'They open the invoice in their portal and pay by UPI or Razorpay. The gateway confirms it, not the browser.' },
  { n: '04', t: 'Receipt and trail', b: 'The payment completes, the invoice moves to paid, a receipt is issued and the audit log records it — one transaction.' },
]

export function Flow() {
  return (
    <section className="tinted border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Marker n="03">The cycle</Marker>
        <h2 className="reveal mt-6 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          From allotment to receipt.
        </h2>

        <div className="flow mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          {STEPS.map((s, i) => (
            <div key={s.n} className="reveal relative" style={{ ['--d' as string]: `${i * 110}ms` }}>
              <span className="bg-background text-primary relative z-10 flex size-9 items-center justify-center rounded-full border font-mono text-xs font-semibold">
                {s.n}
              </span>
              <h3 className="mt-5 font-semibold tracking-tight">{s.t}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 04 · Trust ───────────────────────────────────────────────────────────── */

const GUARANTEES = [
  { icon: ShieldCheck, t: 'Authorization twice', b: 'Row-level security in the database and a permission check inside every operation. Neither is trusted alone.' },
  { icon: ScrollText, t: 'An audit trail you cannot edit', b: 'Audit entries have no update or delete grant. If the audit write fails, the whole operation rolls back with it.' },
  { icon: Users, t: 'Tenants are isolated', b: 'An owner’s scope is resolved server-side from their session — never from anything the browser sends.' },
  { icon: FileText, t: 'GST tax invoices', b: 'Invoices carry the company’s GST profile, apply tax once on the total, and download as a proper tax invoice PDF.' },
]

export function Trust() {
  return (
    <section className="border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Marker n="04">Built in</Marker>
        <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          <div>
            <h2 className="reveal text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              The boring guarantees, kept.
            </h2>
            <p className="reveal text-muted-foreground mt-4 max-w-md leading-relaxed">
              Rent is money and leases are contracts. The parts that protect both are in the database,
              where a mistake in the interface cannot get around them.
            </p>
          </div>

          <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2">
            {GUARANTEES.map((g, i) => (
              <div
                key={g.t}
                className="reveal bg-background p-6"
                style={{ ['--d' as string]: `${i * 80}ms` }}
              >
                <g.icon className="text-primary size-5" aria-hidden="true" />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">{g.t}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{g.b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── 05 · Closing band ────────────────────────────────────────────────────── */

export function ClosingBand({ marketingSite }: { marketingSite: string }) {
  return (
    <section className="band border-t">
      <div className="mx-auto w-full max-w-6xl px-6 py-20 text-center sm:py-28">
        <h2 className="reveal mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Sign in to your workspace.
        </h2>
        <p className="reveal mx-auto mt-4 max-w-lg leading-relaxed text-white/65">
          Administrators, maintenance staff and office owners all start here. You will land on whichever
          product your account has access to.
        </p>
        <div className="reveal mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            className="group text-[color:var(--ink)] inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-medium transition-transform hover:scale-[1.02]"
          >
            Sign in
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href={marketingSite}
            className="inline-flex items-center gap-2 rounded-md border border-white/20 px-6 py-3 text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
          >
            Talk to Itoby Infotech
          </a>
        </div>
      </div>
    </section>
  )
}
