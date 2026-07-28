import { ReceiptText } from 'lucide-react'

import { PageHeader } from '@/components/page-header'
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
import { useAuth } from '@/auth/use-auth'
import { useDownloadReceipt, useOwnerReceipts, type ReceiptRow } from '@/features/receipts/api'
import { formatCurrency, formatTimestamp } from '@/lib/format'

const NO_ROWS: ReceiptRow[] = []

const GATEWAY_LABELS = { UPI: 'UPI', RAZORPAY: 'Razorpay' } as const

export function ReceiptsScreen() {
  const { owner } = useAuth()
  const ownerId = owner?.ownerId ?? ''
  const receipts = useOwnerReceipts(ownerId)
  const download = useDownloadReceipt(ownerId)

  const rows = receipts.data ?? NO_ROWS

  return (
    <section className="space-y-6">
      <PageHeader
        title="Your receipts"
        description="Receipts for your completed payments. Downloads open through a short-lived link."
      />

      {download.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {download.error.message}
        </p>
      ) : null}

      {receipts.isPending ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : receipts.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {receipts.error.message}
        </p>
      ) : rows.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>No receipts</EmptyTitle>
            <EmptyDescription>
              A receipt appears here once one of your payments completes.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice period</TableHead>
              <TableHead>Office unit</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.invoice_period}</TableCell>
                <TableCell>{row.office_unit_code}</TableCell>
                <TableCell>
                  <time dateTime={row.completed_at}>{formatTimestamp(row.completed_at)}</time>
                </TableCell>
                <TableCell>{GATEWAY_LABELS[row.payment_gateway]}</TableCell>
                <TableCell className="font-mono text-xs break-all">
                  {row.transaction_ref ?? '—'}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {formatCurrency(row.amount_paid)}
                </TableCell>
                <TableCell className="text-right">
                  {row.document_ref ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={download.isPending}
                      onClick={() => download.mutate(row.id)}
                    >
                      Download
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">Preparing…</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
