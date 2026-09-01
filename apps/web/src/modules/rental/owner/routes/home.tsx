import { Link } from 'react-router-dom'
import { ArrowRight, Bell, FileText, IndianRupee, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import { KpiCard, KpiGrid } from '@rental-owner/components/kpi-card'
import { PageHeader } from '@rental-owner/components/page-header'
import { Badge } from '@itoby/ui'
import { Button } from '@itoby/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@itoby/ui'
import { Skeleton } from '@itoby/ui'
import { useAuth } from '@rental-owner/auth/use-auth'
import { useOwnerInvoices } from '@rental-owner/features/invoices/api'
import { daysUntil, useOwnerLeases } from '@rental-owner/features/lease/api'
import {
  reminderAmount,
  reminderTitle,
  useOwnerReminders,
} from '@rental-owner/features/notifications/api'
import { formatCurrency, formatDate } from '@rental-owner/lib/format'

const QUICK_ACTIONS = [
  { to: '/app/rental/invoices', label: 'Pay invoice', desc: 'Settle rent & utilities', icon: IndianRupee },
  { to: '/app/rental/complaints', label: 'Raise complaint', desc: 'Report maintenance issues', icon: Wrench },
  { to: '/app/rental/documents', label: 'Documents', desc: 'Lease & account files', icon: FileText },
] as const

export function HomeScreen() {
  const { owner } = useAuth()
  const invoices = useOwnerInvoices()
  const leases = useOwnerLeases()
  const reminders = useOwnerReminders()
  const latestReminders = (reminders.data ?? []).slice(0, 3)

  const totals = useMemo(() => {
    const rows = invoices.data ?? []
    return {
      outstanding: rows.reduce((sum, row) => sum + row.outstanding_amount, 0),
      overdue: rows
        .filter((row) => row.status === 'OVERDUE')
        .reduce((sum, row) => sum + row.outstanding_amount, 0),
      dueCount: rows.filter((row) => row.status !== 'PAID').length,
    }
  }, [invoices.data])

  const activeLeases = useMemo(
    () => (leases.data ?? []).filter((row) => row.status === 'ACTIVE'),
    [leases.data],
  )

  const loading = invoices.isPending || leases.isPending

  return (
    <section className="space-y-6">
      <PageHeader
        title={owner ? `Welcome back, ${owner.name}` : 'Home'}
        description="Your lease overview, outstanding dues, and quick actions — all in one dashboard."
      />

      <KpiGrid>
        <KpiCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          icon={IndianRupee}
          loading={loading}
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(totals.overdue)}
          loading={loading}
          tone={totals.overdue > 0 ? 'warning' : 'default'}
        />
        <KpiCard
          label="Active leases"
          value={String(activeLeases.length)}
          subtitle={`${totals.dueCount} unpaid invoice${totals.dueCount === 1 ? '' : 's'}`}
          loading={loading}
          tone="success"
        />
      </KpiGrid>

      <div className="grid gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="surface-card group flex items-center gap-3 p-4 transition-all hover:border-primary/25 hover:shadow-md"
          >
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <action.icon className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-muted-foreground text-xs">{action.desc}</p>
            </div>
            <ArrowRight
              className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      {latestReminders.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-label">Payment reminders</h2>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link to="/app/rental/reminders">View all</Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {latestReminders.map((row) => {
              const amount = reminderAmount(row)
              const overdue = row.notification_type === 'REMINDER_OVERDUE'
              return (
                <li key={row.id}>
                  <Link
                    to="/app/rental/invoices"
                    className="surface-card flex items-center gap-3 p-4 transition-all hover:border-primary/25 hover:shadow-md"
                  >
                    <div
                      className={
                        overdue
                          ? 'bg-destructive/10 text-destructive flex size-10 shrink-0 items-center justify-center rounded-xl'
                          : 'bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl'
                      }
                    >
                      <Bell className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{reminderTitle(row)}</p>
                        <Badge variant={overdue ? 'destructive' : 'secondary'}>
                          {overdue ? 'Overdue' : 'Upcoming'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {amount != null ? formatCurrency(amount) : 'Amount due'}
                        {row.payload.due_date ? ` · Due ${formatDate(row.payload.due_date)}` : ''}
                      </p>
                    </div>
                    <ArrowRight className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-label">Active leases</h2>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/app/rental/lease">View all</Link>
          </Button>
        </div>

        {leases.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
        ) : leases.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {leases.error.message}
          </p>
        ) : activeLeases.length === 0 ? (
          <Card className="border-dashed bg-card/60 py-8">
            <CardContent className="text-muted-foreground px-6 text-center text-sm">
              You do not have an active allotment yet. Once an office unit is allotted to you, it
              appears here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeLeases.map((lease) => {
              const remaining = daysUntil(lease.lease_end)
              return (
                <Card
                  key={lease.id}
                  className="border-primary/10 bg-card/90 py-4 shadow-sm backdrop-blur-sm"
                >
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="flex items-start justify-between gap-2 text-base">
                      <span>
                        {lease.building_name} · {lease.unit_code}
                      </span>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-0">
                        Active
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 px-4 text-sm">
                    <p>
                      {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
                    </p>
                    <p className="font-mono font-medium tabular-nums">
                      {formatCurrency(lease.rent_amount)} · {lease.billing_cycle ?? '—'}
                    </p>
                    {remaining !== null ? (
                      <p className="text-muted-foreground text-xs">
                        {remaining < 0
                          ? `Ended ${Math.abs(remaining)} day${Math.abs(remaining) === 1 ? '' : 's'} ago`
                          : remaining === 0
                            ? 'Ends today'
                            : `${remaining} day${remaining === 1 ? '' : 's'} remaining`}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
