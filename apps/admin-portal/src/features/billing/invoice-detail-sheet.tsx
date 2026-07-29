import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { GatewayType, PaymentStatus, Uuid } from '@itoby/shared'
import { Link } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/features/billing/status-badge'
import { ElectricityChargeForm } from '@/features/billing/electricity-charge-form'
import { MaintenanceChargeForm } from '@/features/billing/maintenance-charge-form'
import { billingKeys, useDownloadInvoicePdf, useSendInvoiceReminder, type BillingRow } from '@/features/billing/api'
import { InvoiceGstSummary } from '@/features/billing/invoice-gst-summary'
import { useGlobalConfig } from '@/features/settings/api'
import { Button } from '@/components/ui/button'
import { dbError, mapDbError } from '@/lib/db-error'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface InvoicePaymentRow {
  id: Uuid
  amount: number
  status: PaymentStatus
  gateway: GatewayType
  transaction_ref: string | null
  created_at: string
  completed_at: string | null
}

interface InvoiceDetailSheetProps {
  invoice: BillingRow | null
  onClose: () => void
}

function useInvoicePayments(invoiceId: Uuid | null) {
  return useQuery({
    queryKey: ['billing', 'invoice-payments', invoiceId],
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

export function InvoiceDetailSheet({ invoice, onClose }: InvoiceDetailSheetProps) {
  const payments = useInvoicePayments(invoice?.invoice_id ?? null)
  const queryClient = useQueryClient()
  const downloadPdf = useDownloadInvoicePdf()
  const sendReminder = useSendInvoiceReminder()
  const config = useGlobalConfig()
  const gstRate = Number(config.data?.default_gst_rate_percent ?? 18)
  const [localInvoice, setLocalInvoice] = useState<BillingRow | null>(invoice)

  useEffect(() => {
    setLocalInvoice(invoice)
  }, [invoice])

  const shown = localInvoice
  const canRemind = shown != null && shown.status !== 'PAID'

  async function onSendReminder() {
    if (!shown) return
    try {
      await sendReminder.mutateAsync(shown.invoice_id)
      toast.success('Bill reminder shared with the tenant')
    } catch (error) {
      toast.error(mapDbError(error).message)
    }
  }

  return (
    <Sheet open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Invoice {shown?.billing_cycle_key ?? ''}</SheetTitle>
          <SheetDescription>
            {shown
              ? `${shown.unit_code} · ${shown.building_name} · ${shown.owner_name}`
              : ''}
          </SheetDescription>
          {shown ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={downloadPdf.isPending}
                onClick={() => downloadPdf.mutate(shown.invoice_id)}
              >
                {downloadPdf.isPending ? 'Preparing PDF…' : 'Download tax invoice'}
              </Button>
              {canRemind ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={sendReminder.isPending}
                  onClick={() => void onSendReminder()}
                >
                  {sendReminder.isPending ? 'Sharing…' : 'Share bill reminder'}
                </Button>
              ) : null}
            </div>
          ) : null}
        </SheetHeader>

        {shown ? (
          <div className="space-y-6 px-4 pb-6">
            <div className="rounded-xl border">
              <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">
                    Invoice total (incl. GST)
                  </p>
                  <p className="font-mono text-2xl font-semibold tabular-nums">
                    {formatCurrency(shown.total_amount)}
                  </p>
                </div>
                <InvoiceStatusBadge status={shown.status} />
              </div>
              <p className="text-muted-foreground border-b px-4 py-2 text-xs">
                Line items are taxable values (before GST).
              </p>
              <dl className="divide-y text-sm">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-muted-foreground">Office rent</dt>
                  <dd className="font-mono tabular-nums">{formatCurrency(shown.rent_amount)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-muted-foreground">
                    Electricity
                    {shown.electricity_units != null ? (
                      <span className="mt-0.5 block text-xs">
                        {shown.electricity_units} units
                        {shown.electricity_units > 0 && (shown.electricity_amount ?? 0) > 0
                          ? ` × ₹${Math.round(((shown.electricity_amount ?? 0) / shown.electricity_units) * 100) / 100}/unit`
                          : ' consumed'}
                      </span>
                    ) : null}
                    {shown.electricity_note ? (
                      <span className="mt-0.5 block text-xs">{shown.electricity_note}</span>
                    ) : null}
                  </dt>
                  <dd className="font-mono tabular-nums">
                    {formatCurrency(shown.electricity_amount ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="text-muted-foreground">Maintenance</dt>
                  <dd className="font-mono tabular-nums">
                    {formatCurrency(shown.maintenance_amount ?? 0)}
                  </dd>
                </div>
                {(shown.additional_charges ?? 0) > 0 ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <dt className="text-muted-foreground">Other charges</dt>
                    <dd className="font-mono tabular-nums">
                      {formatCurrency(shown.additional_charges)}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <InvoiceGstSummary
                parts={{
                  rent_amount: shown.rent_amount,
                  additional_charges: shown.additional_charges,
                  electricity_amount: shown.electricity_amount,
                  maintenance_amount: shown.maintenance_amount,
                }}
                gstRatePercent={gstRate}
              />
            </div>

            <dl className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Billing period</dt>
              <dd>
                {formatDate(shown.billing_period_start)} – {formatDate(shown.billing_period_end)}
              </dd>
              <dt className="text-muted-foreground">Due date</dt>
              <dd>{formatDate(shown.due_date)}</dd>
              <dt className="text-muted-foreground">Tenant</dt>
              <dd>
                <Link
                  to={`/tenants/${shown.office_owner_id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {shown.owner_name}
                </Link>
              </dd>
            </dl>

            <ElectricityChargeForm
              invoice={shown}
              onSaved={(updated) => {
                    setLocalInvoice((current) =>
                      current
                        ? {
                            ...current,
                            electricity_amount: updated.electricity_amount,
                            electricity_units: updated.electricity_units ?? current.electricity_units,
                            electricity_note: updated.electricity_note ?? '',
                            total_amount: updated.total_amount,
                          }
                        : current,
                    )
                void queryClient.invalidateQueries({ queryKey: billingKeys.all })
              }}
            />

            <MaintenanceChargeForm
              invoice={shown}
              onSaved={(updated) => {
                setLocalInvoice((current) =>
                  current
                    ? {
                        ...current,
                        maintenance_amount: updated.maintenance_amount,
                        total_amount: updated.total_amount,
                      }
                    : current,
                )
                void queryClient.invalidateQueries({ queryKey: billingKeys.all })
              }}
            />

            <Separator />

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Payment history</h3>
              {payments.isPending ? (
                <Skeleton className="h-16 w-full" />
              ) : payments.isError ? (
                <p role="alert" className="text-destructive text-sm">
                  {payments.error.message}
                </p>
              ) : (payments.data ?? []).length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No payments against this invoice yet.
                </p>
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
                          {formatDateTime(row.completed_at ?? row.created_at)}
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
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
