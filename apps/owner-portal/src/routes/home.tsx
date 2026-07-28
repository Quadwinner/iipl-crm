import { Link } from 'react-router-dom'
import { FileText, IndianRupee, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import { KpiCard, KpiGrid } from '@/components/kpi-card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/use-auth'
import { useOwnerInvoices } from '@/features/invoices/api'
import { daysUntil, useOwnerLeases } from '@/features/lease/api'
import { formatCurrency, formatDate } from '@/lib/format'

export function HomeScreen() {
  const { owner } = useAuth()
  const invoices = useOwnerInvoices()
  const leases = useOwnerLeases()

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
        title={owner ? `Welcome, ${owner.name}` : 'Home'}
        description="Your lease overview, dues, and quick actions."
      />

      <KpiGrid>
        <KpiCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          icon={IndianRupee}
          loading={loading}
        />
        <KpiCard label="Overdue" value={formatCurrency(totals.overdue)} loading={loading} />
        <KpiCard
          label="Active leases"
          value={String(activeLeases.length)}
          subtitle={`${totals.dueCount} unpaid invoice${totals.dueCount === 1 ? '' : 's'}`}
          loading={loading}
        />
      </KpiGrid>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" asChild>
          <Link to="/invoices">Pay an invoice</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/complaints">
            <Wrench aria-hidden="true" />
            Raise a complaint
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/documents">
            <FileText aria-hidden="true" />
            View documents
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Active leases
          </h2>
          <Button type="button" variant="ghost" size="sm" asChild>
            <Link to="/lease">View all</Link>
          </Button>
        </div>

        {leases.isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : leases.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {leases.error.message}
          </p>
        ) : activeLeases.length === 0 ? (
          <Card className="py-6">
            <CardContent className="text-muted-foreground px-6 text-sm">
              You do not have an active allotment yet. Once an office unit is allotted to you, it
              appears here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeLeases.map((lease) => {
              const remaining = daysUntil(lease.lease_end)
              return (
                <Card key={lease.id} className="py-4">
                  <CardHeader className="px-4 pb-2">
                    <CardTitle className="flex items-start justify-between gap-2 text-base">
                      <span>
                        {lease.building_name} · {lease.unit_code}
                      </span>
                      <Badge>Active</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 px-4 text-sm">
                    <p>
                      {formatDate(lease.lease_start)} – {formatDate(lease.lease_end)}
                    </p>
                    <p className="font-mono tabular-nums">
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
