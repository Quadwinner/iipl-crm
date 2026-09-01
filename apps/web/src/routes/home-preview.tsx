import { Building2, CreditCard, IndianRupee, LayoutDashboard, ScrollText, Users, Wrench } from 'lucide-react'

/**
 * A scaled-down rendering of the rental dashboard, used as the hero visual.
 *
 * Deliberately hand-built rather than a screenshot: it stays sharp at any size,
 * respects the live theme tokens, and the numbers are the same shapes the real
 * dashboard shows (₹, tabular figures, invoice-number format) without claiming
 * to be live data.
 */
const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Building2, label: 'Office units' },
  { icon: Users, label: 'Tenants' },
  { icon: IndianRupee, label: 'Billing' },
  { icon: CreditCard, label: 'Payments' },
  { icon: Wrench, label: 'Complaints' },
  { icon: ScrollText, label: 'Audit log' },
]

const KPIS = [
  { label: 'Total units', value: '24' },
  { label: 'Occupancy', value: '92%' },
  { label: 'Collected', value: '₹4.2L' },
]

const ROWS = [
  { cycle: 'IIPL/2026-27/8', unit: 'b-004', amount: '₹14,279', tone: 'paid' },
  { cycle: 'IIPL/2026-27/7', unit: 'b-002', amount: '₹10,000', tone: 'due' },
  { cycle: 'IIPL/2026-27/6', unit: 'b-001', amount: '₹30,000', tone: 'overdue' },
]

const TONE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  due: 'bg-slate-100 text-slate-600',
  overdue: 'bg-rose-100 text-rose-700',
}

const BARS = [38, 62, 45, 78, 56, 88, 70]

export function DashboardPreview() {
  // text-foreground is load-bearing: this light card sits inside the dark hero,
  // which sets a near-white color that anything without an explicit color here
  // would otherwise inherit — rendering it white on white.
  return (
    <div className="frame bg-card text-foreground relative w-full overflow-hidden rounded-xl border">
      <div className="frame-shine" aria-hidden="true" />

      {/* chrome */}
      <div className="bg-muted/60 flex items-center gap-1.5 border-b px-3 py-2">
        <span className="size-2 rounded-full bg-rose-400/70" />
        <span className="size-2 rounded-full bg-amber-400/70" />
        <span className="size-2 rounded-full bg-emerald-400/70" />
        <span className="bg-background/70 text-muted-foreground ml-2 rounded px-2 py-0.5 font-mono text-[9px]">
          /app/rental/dashboard
        </span>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="bg-sidebar text-sidebar-foreground w-[27%] shrink-0 py-3">
          <div className="flex items-center gap-1.5 px-3 pb-3">
            <span className="bg-sidebar-primary/25 flex size-4 items-center justify-center rounded text-[7px] font-bold">
              II
            </span>
            <span className="text-[9px] font-semibold">IIPL</span>
          </div>
          {NAV.map((n, i) => (
            <div
              key={n.label}
              className={`row-in mx-1.5 mb-0.5 flex items-center gap-1.5 rounded px-2 py-1.5 text-[8px] ${
                n.active ? 'bg-sidebar-primary/20 font-medium' : 'opacity-55'
              }`}
              style={{ ['--d' as string]: `${900 + i * 55}ms` }}
            >
              <n.icon className="size-2.5" aria-hidden="true" />
              {n.label}
            </div>
          ))}
        </aside>

        {/* content */}
        <div className="flex-1 space-y-2.5 p-3">
          <div className="grid grid-cols-3 gap-2">
            {KPIS.map((k, i) => (
              <div
                key={k.label}
                className="row-in bg-background rounded-lg border p-2"
                style={{ ['--d' as string]: `${1080 + i * 90}ms` }}
              >
                <p className="text-muted-foreground text-[7px] tracking-wide uppercase">{k.label}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-background rounded-lg border p-2.5">
            <p className="text-muted-foreground text-[7px] tracking-wide uppercase">Revenue</p>
            <div className="mt-2 flex h-14 items-end gap-1.5">
              {BARS.map((h, i) => (
                <div
                  key={i}
                  className="bar bg-primary/85 flex-1 rounded-sm"
                  style={{ height: `${h}%`, ['--d' as string]: `${1320 + i * 70}ms` }}
                />
              ))}
            </div>
          </div>

          <div className="bg-background overflow-hidden rounded-lg border">
            {ROWS.map((r, i) => (
              <div
                key={r.cycle}
                className="row-in flex items-center gap-2 border-b px-2.5 py-1.5 text-[8px] last:border-b-0"
                style={{ ['--d' as string]: `${1560 + i * 100}ms` }}
              >
                <span className="font-mono">{r.cycle}</span>
                <span className="text-muted-foreground">{r.unit}</span>
                <span className="ml-auto font-mono">{r.amount}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[6px] font-medium ${TONE[r.tone]}`}>
                  {r.tone}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
