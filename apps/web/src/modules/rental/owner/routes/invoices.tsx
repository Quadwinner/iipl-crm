import { useMemo, useState } from 'react'
import { IndianRupee } from 'lucide-react'
import type { InvoiceStatus } from '@itoby/shared'

import { KpiCard, KpiGrid } from '@rental-owner/components/kpi-card'
import { PageHeader } from '@rental-owner/components/page-header'
import { StatusTabs } from '@rental-owner/components/status-tabs'
import { Button } from '@rental-owner/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@rental-owner/components/ui/empty'
import { Skeleton } from '@rental-owner/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rental-owner/components/ui/table'
import { useOwnerInvoices, type InvoiceRow } from '@rental-owner/features/invoices/api'
import { InvoiceDetailDialog } from '@rental-owner/features/invoices/invoice-detail-dialog'
import { PayInvoiceDialog } from '@rental-owner/features/invoices/pay-invoice-dialog'
import { InvoiceStatusBadge, invoiceStatusLabel } from '@rental-owner/features/invoices/status-badge'
import { formatCurrency, formatDate } from '@rental-owner/lib/format'
import { cn } from '@rental-owner/lib/utils'

const NO_ROWS: InvoiceRow[] = []

const STATUS_ORDER: Record<InvoiceStatus, number> = {
  OVERDUE: 0,
  DUE: 1,
  PARTIALLY_PAID: 2,
  PAID: 3,
}

const BORDER_BY_STATUS: Record<InvoiceStatus, string> = {
  OVERDUE: 'border-l-destructive',
  DUE: 'border-l-chart-1',
  PARTIALLY_PAID: 'border-l-chart-4',
  PAID: 'border-l-muted-foreground/30',
}

export function InvoicesScreen() {
  const invoices = useOwnerInvoices()
  const [statusTab, setStatusTab] = useState<InvoiceStatus | 'ALL'>('ALL')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const sorted = useMemo(() => {
    const rows = [...(invoices.data ?? NO_ROWS)]
    rows.sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      if (byStatus !== 0) return byStatus
      return a.due_date.localeCompare(b.due_date)
    })
    return rows
  }, [invoices.data])

  const rows = useMemo(
    () => (statusTab === 'ALL' ? sorted : sorted.filter((row) => row.status === statusTab)),
    [sorted, statusTab],
  )

  const detail = sorted.find((row) => row.invoice_id === detailId) ?? null
  const paying = sorted.find((row) => row.invoice_id === payingId) ?? null

  const totals = useMemo(
    () =>
      sorted.reduce(
        (accumulator, row) => ({
          outstanding: accumulator.outstanding + row.outstanding_amount,
          overdue: accumulator.overdue + (row.status === 'OVERDUE' ? row.outstanding_amount : 0),
          count: accumulator.count + 1,
        }),
        { outstanding: 0, overdue: 0, count: 0 },
      ),
    [sorted],
  )

  const statusCounts = useMemo(() => {
    const counts: Record<InvoiceStatus | 'ALL', number> = {
      ALL: sorted.length,
      DUE: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      OVERDUE: 0,
    }
    for (const row of sorted) counts[row.status] += 1
    return counts
  }, [sorted])

  return (
    <section className="space-y-6">
      <PageHeader
        title="Your invoices"
        description="Rent invoices for your allotted office units. Overdue items are listed first."
      />

      <KpiGrid>
        <KpiCard
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          icon={IndianRupee}
          loading={invoices.isPending}
        />
        <KpiCard
          label="Overdue"
          value={formatCurrency(totals.overdue)}
          loading={invoices.isPending}
          tone={totals.overdue > 0 ? 'warning' : 'default'}
        />
        <KpiCard label="Invoices" value={String(totals.count)} loading={invoices.isPending} />
      </KpiGrid>

      <StatusTabs
        value={statusTab}
        onChange={setStatusTab}
        options={[
          { value: 'ALL', label: 'All', count: statusCounts.ALL },
          { value: 'OVERDUE', label: invoiceStatusLabel('OVERDUE'), count: statusCounts.OVERDUE },
          { value: 'DUE', label: invoiceStatusLabel('DUE'), count: statusCounts.DUE },
          {
            value: 'PARTIALLY_PAID',
            label: invoiceStatusLabel('PARTIALLY_PAID'),
            count: statusCounts.PARTIALLY_PAID,
          },
          { value: 'PAID', label: invoiceStatusLabel('PAID'), count: statusCounts.PAID },
        ]}
      />

      <p aria-live="polite" className="text-muted-foreground text-sm">
        {awaitingConfirmation
          ? 'Payment started. Your gateway confirmation may take a moment to arrive; this invoice updates once it does.'
          : ''}
      </p>

      {invoices.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : invoices.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {invoices.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="surface-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IndianRupee aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No invoices</EmptyTitle>
            <EmptyDescription>
              {statusTab === 'ALL'
                ? 'Invoices appear here once a billing cycle runs for your lease.'
                : 'No invoices match this status.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cycle</TableHead>
              <TableHead>Office unit</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.invoice_id}
                className={cn('cursor-pointer border-l-4', BORDER_BY_STATUS[row.status])}
                onClick={() => setDetailId(row.invoice_id)}
              >
                <TableCell className="font-medium">{row.billing_cycle_key}</TableCell>
                <TableCell>
                  {row.unit_code}
                  <span className="text-muted-foreground"> · {row.building_name}</span>
                </TableCell>
                <TableCell>
                  <time dateTime={row.due_date}>{formatDate(row.due_date)}</time>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(row.total_amount)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(row.outstanding_amount)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  {row.status === 'PAID' || row.outstanding_amount <= 0 ? null : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation()
                        setPayingId(row.invoice_id)
                      }}
                    >
                      Pay
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}

      <InvoiceDetailDialog
        invoice={detail}
        onClose={() => setDetailId(null)}
        onPay={(invoice) => setPayingId(invoice.invoice_id)}
      />

      <PayInvoiceDialog
        invoice={paying}
        onClose={() => setPayingId(null)}
        onAwaitingConfirmation={() => setAwaitingConfirmation(true)}
      />
    </section>
  )
}
