export interface InvoiceGstBreakdown {
  taxableAmount: number
  gstRatePercent: number
  cgstRatePercent: number
  sgstRatePercent: number
  cgstAmount: number
  sgstAmount: number
  taxAmount: number
  grandTotal: number
}

export interface InvoiceChargeParts {
  rent_amount: number
  additional_charges?: number | null
  electricity_amount?: number | null
  maintenance_amount?: number | null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/** Pre-GST subtotal for an invoice's charge lines. */
export function invoiceTaxableSubtotal(parts: InvoiceChargeParts): number {
  return round2(
    parts.rent_amount +
      (parts.additional_charges ?? 0) +
      (parts.electricity_amount ?? 0) +
      (parts.maintenance_amount ?? 0),
  )
}

/** GST split matching the tax invoice PDF (CGST + SGST halves). */
export function computeInvoiceGstBreakdown(
  taxableAmount: number,
  gstRatePercent = 18,
): InvoiceGstBreakdown {
  const taxAmount = round2((taxableAmount * gstRatePercent) / 100)
  const cgstAmount = round2(taxAmount / 2)
  const sgstAmount = round2(taxAmount - cgstAmount)
  const halfRate = round2(gstRatePercent / 2)

  return {
    taxableAmount,
    gstRatePercent,
    cgstRatePercent: halfRate,
    sgstRatePercent: halfRate,
    cgstAmount,
    sgstAmount,
    taxAmount,
    grandTotal: round2(taxableAmount + taxAmount),
  }
}

/** Convenience: charge lines + rate → full breakdown. */
export function invoiceGstFromParts(
  parts: InvoiceChargeParts,
  gstRatePercent = 18,
): InvoiceGstBreakdown {
  return computeInvoiceGstBreakdown(invoiceTaxableSubtotal(parts), gstRatePercent)
}
