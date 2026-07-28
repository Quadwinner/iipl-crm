import { useQuery } from '@tanstack/react-query'
import type { GatewayType, PaymentStatus, Uuid } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { dbError } from '@/lib/db-error'
import { formatCurrency, formatDate, formatTimestamp } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import type { InvoiceRow } from './api'
import { useDownloadInvoicePdf } from './api'
import { InvoiceGstSummary } from './invoice-gst-summary'
import { useGstRatePercent } from './use-gst-rate'
import { InvoiceStatusBadge } from './status-badge'

interface InvoicePaymentRow {
  id: Uuid
  amount: number
  status: PaymentStatus
  gateway: GatewayType
  transaction_ref: string | null
  created_at: string
  completed_at: string | null
}

interface InvoiceDetailDialogProps {
  invoice: InvoiceRow | null
  onClose: () => void
  onPay: (invoice: InvoiceRow) => void
}

function useInvoicePayments(invoiceId: Uuid | null) {
  return useQuery({
    queryKey: ['owner-invoice-payments', invoiceId],
    enabled: invoiceId !== null,
    queryFn: async (): Promise<InvoicePaymentRow[]> => {
      const { data, error } = await supabase()
        .from('payment')
        .select('id, amount, status, gateway, transaction_ref, created_at, completed_at')
        .eq('invoice_id', invoiceId as Uuid)
        .order('created_at', { ascending: false })
      if (error) throw dbError(error, 'Payment history could not be loaded.')
      return data ?? []
    },
  })
}

export function InvoiceDetailDialog({ invoice, onClose, onPay }: InvoiceDetailDialogProps) {
  const payments = useInvoicePayments(invoice?.invoice_id ?? null)
  const downloadPdf = useDownloadInvoicePdf()
  const gstRate = useGstRatePercent()
  const canPay = invoice != null && invoice.status !== 'PAID' && invoice.outstanding_amount > 0

  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto sm:max-w-lg">
        {invoice ? (
          <>
            <DialogHeader>
              <DialogTitle>Invoice {invoice.billing_cycle_key}</DialogTitle>
              <DialogDescription>
                {invoice.unit_code} · {invoice.building_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="rounded-xl border">
                <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-3">
                  <div>
                    <p className="text-muted-foreground text-xs tracking-wide uppercase">
                      Amount due (incl. GST)
                    </p>
                    <p className="font-mono text-2xl font-semibold tabular-nums">
                      {formatCurrency(invoice.outstanding_amount)}
                    </p>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <p className="text-muted-foreground border-b px-4 py-2 text-xs">
                  Line items are taxable values (before GST).
                </p>
                <dl className="divide-y text-sm">
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Office rent</dt>
                    <dd className="font-mono tabular-nums">{formatCurrency(invoice.rent_amount)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">
                      Electricity
                      {invoice.electricity_units != null ? (
                        <span className="mt-0.5 block text-xs">
                          {invoice.electricity_units} units
                          {invoice.electricity_units > 0 && (invoice.electricity_amount ?? 0) > 0
                            ? ` × ₹${Math.round(((invoice.electricity_amount ?? 0) / invoice.electricity_units) * 100) / 100}/unit`
                            : ' consumed'}
                        </span>
                      ) : null}
                      {invoice.electricity_note ? (
                        <span className="mt-0.5 block text-xs">{invoice.electricity_note}</span>
                      ) : null}
                    </dt>
                    <dd className="font-mono tabular-nums">
                      {formatCurrency(invoice.electricity_amount ?? 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">
                      Maintenance
                      {invoice.maintenance_note ? (
                        <span className="mt-0.5 block text-xs">{invoice.maintenance_note}</span>
                      ) : null}
                    </dt>
                    <dd className="font-mono tabular-nums">
                      {formatCurrency(invoice.maintenance_amount ?? 0)}
                    </dd>
                  </div>
                  {(invoice.additional_charges ?? 0) > 0 ? (
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <dt className="text-muted-foreground">Other charges</dt>
                      <dd className="font-mono tabular-nums">
                        {formatCurrency(invoice.additional_charges)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Already paid</dt>
                    <dd className="font-mono tabular-nums">{formatCurrency(invoice.paid_amount)}</dd>
                  </div>
                </dl>
                <InvoiceGstSummary
                  parts={{
                    rent_amount: invoice.rent_amount,
                    additional_charges: invoice.additional_charges,
                    electricity_amount: invoice.electricity_amount,
                    maintenance_amount: invoice.maintenance_amount,
                  }}
                  gstRatePercent={gstRate.data ?? 18}
                  payableTotal={invoice.outstanding_amount}
                />
              </div>

              <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Period</dt>
                <dd>
                  {formatDate(invoice.billing_period_start)} –{' '}
                  {formatDate(invoice.billing_period_end)}
                </dd>
                <dt className="text-muted-foreground">Due date</dt>
                <dd>{formatDate(invoice.due_date)}</dd>
              </dl>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment history</h3>
                {payments.isPending ? (
                  <Skeleton className="h-16 w-full" />
                ) : payments.isError ? (
                  <p role="alert" className="text-destructive text-sm">
                    {payments.error.message}
                  </p>
                ) : (payments.data ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No payments yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payments.data ?? []).map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatTimestamp(row.completed_at ?? row.created_at)}
                          </TableCell>
                          <TableCell>{row.gateway}</TableCell>
                          <TableCell className="text-right font-mono tabular-nums">
                            {formatCurrency(row.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={row.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-start">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadPdf.isPending}
                onClick={() => downloadPdf.mutate(invoice.invoice_id)}
              >
                {downloadPdf.isPending ? 'Preparing PDF…' : 'Download tax invoice'}
              </Button>
              {canPay ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onPay(invoice)
                    onClose()
                  }}
                >
                  Pay now
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
