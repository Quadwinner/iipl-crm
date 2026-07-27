import { useMemo, useState } from 'react'
import { IndianRupee } from 'lucide-react'

import { ScreenHeader } from '@/components/screen-header'
import { StatRow } from '@/components/stat-row'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useOwnerInvoices, type InvoiceRow } from '@/features/invoices/api'
import { PayInvoiceDialog } from '@/features/invoices/pay-invoice-dialog'
import { InvoiceStatusBadge } from '@/features/invoices/status-badge'
import { formatCurrency, formatDate } from '@/lib/format'

const NO_ROWS: InvoiceRow[] = []

export function InvoicesScreen() {
  const invoices = useOwnerInvoices()
  const [payingId, setPayingId] = useState<string | null>(null)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  const rows = invoices.data ?? NO_ROWS
  const paying = rows.find((row) => row.invoice_id === payingId) ?? null

  const totals = useMemo(
    () =>
      rows.reduce(
        (accumulator, row) => ({
          outstanding: accumulator.outstanding + row.outstanding_amount,
          overdue: accumulator.overdue + (row.status === 'OVERDUE' ? row.outstanding_amount : 0),
          count: accumulator.count + 1,
        }),
        { outstanding: 0, overdue: 0, count: 0 },
      ),
    [rows],
  )

  return (
    <>
      <ScreenHeader title="Your invoices" />

      <StatRow
        loading={invoices.isPending}
        items={[
          { label: 'Outstanding', value: formatCurrency(totals.outstanding) },
          { label: 'Overdue', value: formatCurrency(totals.overdue) },
          { label: 'Invoices', value: String(totals.count) },
        ]}
      />

      <p aria-live="polite" className="text-muted-foreground mt-4 text-sm">
        {awaitingConfirmation
          ? 'Payment started. Your gateway confirmation may take a moment to arrive; this invoice updates once it does.'
          : ''}
      </p>

      <div className="mt-6">
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
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IndianRupee aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>No invoices</EmptyTitle>
              <EmptyDescription>
                Invoices appear here once a billing cycle runs for your lease.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
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
                <TableRow key={row.invoice_id}>
                  <TableCell>{row.billing_cycle_key}</TableCell>
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
                        onClick={() => setPayingId(row.invoice_id)}
                      >
                        Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PayInvoiceDialog
        invoice={paying}
        onClose={() => setPayingId(null)}
        onAwaitingConfirmation={() => setAwaitingConfirmation(true)}
      />
    </>
  )
}
