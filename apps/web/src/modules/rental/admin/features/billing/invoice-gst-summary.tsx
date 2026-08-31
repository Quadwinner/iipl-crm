import {
  computeInvoiceGstBreakdown,
  invoiceTaxableSubtotal,
  type InvoiceChargeParts,
} from '@itoby/shared'
import { formatCurrency } from '@rental-admin/lib/format'

interface InvoiceGstSummaryProps {
  parts: InvoiceChargeParts
  gstRatePercent: number
  /** When set, shown as the payable total (e.g. after partial payment). */
  payableTotal?: number
}

export function InvoiceGstSummary({ parts, gstRatePercent, payableTotal }: InvoiceGstSummaryProps) {
  const taxable = invoiceTaxableSubtotal(parts)
  const gst = computeInvoiceGstBreakdown(taxable, gstRatePercent)

  return (
    <div className="border-t bg-muted/20 text-sm">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <dt className="text-muted-foreground">Taxable amount</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(gst.taxableAmount)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <dt className="text-muted-foreground">CGST {gst.cgstRatePercent}%</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(gst.cgstAmount)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <dt className="text-muted-foreground">SGST {gst.sgstRatePercent}%</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(gst.sgstAmount)}</dd>
      </div>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 font-medium">
        <dt>{payableTotal != null ? 'Amount due (incl. GST)' : 'Invoice total (incl. GST)'}</dt>
        <dd className="font-mono tabular-nums">
          {formatCurrency(payableTotal ?? gst.grandTotal)}
        </dd>
      </div>
    </div>
  )
}
