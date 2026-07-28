/**
 * Edge Function: receipt-pdf
 * Task 18.2 (follow-up async step)
 * Requirements 10.1
 *
 * Renders a polished Payment Receipt PDF for an already-generated Receipt row,
 * stores it in the private `receipts` bucket, and records the path on
 * receipt.document_ref. Idempotent when document_ref is already set.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'npm:pdf-lib@1.17.1'

const BUCKET = 'receipts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface ReceiptRow {
  id: string
  office_owner_id: string
  office_owner_name: string
  office_unit_code: string
  invoice_period: string
  amount_paid: number
  payment_gateway: string
  transaction_ref: string | null
  completed_at: string
  document_ref: string | null
  payment_id: string
}

interface InvoiceBreakdown {
  rent_amount: number
  electricity_amount: number
  electricity_units: number | null
  electricity_note: string | null
  maintenance_amount: number
  maintenance_note: string | null
  additional_charges: number
  total_amount: number
  billing_cycle_key: string
  billing_period_start: string
  billing_period_end: string
  building_name: string | null
}

const ink = rgb(0.12, 0.14, 0.18)
const muted = rgb(0.42, 0.45, 0.5)
const line = rgb(0.88, 0.89, 0.91)
const accent = rgb(0.12, 0.35, 0.55)
const accentSoft = rgb(0.93, 0.96, 0.98)
const white = rgb(1, 1, 1)

function pdfSafeText(text: string): string {
  // Standard PDF fonts only support WinAnsi. Normalize Intl output from Deno/ICU.
  return text
    .replace(/\u20B9/g, 'Rs.')
    .replace(/\u202f/g, ',')
    .replace(/\u00a0/g, ' ')
}

function formatInr(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `Rs. ${formatted}`
}

function formatDateOnly(value: string): string {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return value
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = ink,
) {
  page.drawText(pdfSafeText(text), { x, y, size, font, color })
}

async function renderReceiptPdf(
  receipt: ReceiptRow,
  invoice: InvoiceBreakdown | null,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  // Top brand bar
  page.drawRectangle({ x: 0, y: 792, width: 595, height: 50, color: accent })
  drawText(page, 'IIPL', 48, 815, 18, bold, white)
  drawText(page, 'Office Rentals', 48, 800, 10, font, white)
  drawText(page, 'PAYMENT RECEIPT', 360, 812, 14, bold, white)

  // Accent strip under header
  page.drawRectangle({ x: 0, y: 786, width: 595, height: 6, color: accentSoft })

  let y = 750
  drawText(page, 'Official payment confirmation', 48, y, 11, font, muted)
  y -= 28

  // Meta card
  page.drawRectangle({
    x: 40,
    y: y - 70,
    width: 515,
    height: 82,
    color: accentSoft,
    borderColor: line,
    borderWidth: 1,
  })
  drawText(page, 'Receipt ID', 56, y - 18, 9, font, muted)
  drawText(page, receipt.id, 56, y - 34, 10, bold, ink)
  drawText(page, 'Paid on', 320, y - 18, 9, font, muted)
  drawText(page, formatDateTime(receipt.completed_at), 320, y - 34, 10, bold, ink)
  drawText(page, 'Gateway', 56, y - 54, 9, font, muted)
  drawText(page, receipt.payment_gateway, 56, y - 68, 10, bold, ink)
  drawText(page, 'Transaction ref', 320, y - 54, 9, font, muted)
  drawText(page, receipt.transaction_ref ?? '—', 320, y - 68, 10, bold, ink)
  y -= 110

  // Parties
  drawText(page, 'Billed to', 48, y, 9, font, muted)
  y -= 16
  drawText(page, receipt.office_owner_name, 48, y, 13, bold, ink)
  y -= 16
  const unitLine = invoice?.building_name
    ? `${invoice.building_name} · Unit ${receipt.office_unit_code}`
    : `Unit ${receipt.office_unit_code}`
  drawText(page, unitLine, 48, y, 10, font, muted)
  y -= 28

  // Invoice period
  const periodLabel = invoice
    ? `${formatDateOnly(invoice.billing_period_start)} – ${formatDateOnly(invoice.billing_period_end)}`
    : receipt.invoice_period
  drawText(page, 'Billing period', 48, y, 9, font, muted)
  y -= 14
  drawText(page, periodLabel, 48, y, 11, bold, ink)
  if (invoice) {
    drawText(page, `Cycle ${invoice.billing_cycle_key}`, 320, y, 10, font, muted)
  }
  y -= 28

  // Line items table header
  page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 22, color: accent })
  drawText(page, 'Description', 52, y + 2, 10, bold, white)
  drawText(page, 'Amount', 470, y + 2, 10, bold, white)
  y -= 28

  const lines: Array<[string, number]> = []
  if (invoice) {
    lines.push(['Office rent', Number(invoice.rent_amount)])
    if (Number(invoice.electricity_amount) > 0) {
      const note = invoice.electricity_note?.trim()
      const units = invoice.electricity_units
      let detail: string | null = null
      if (units != null && units > 0) {
        const rate = Math.round((Number(invoice.electricity_amount) / units) * 100) / 100
        detail = `${units} units × Rs. ${rate}`
      }
      if (note) detail = detail ? `${detail} · ${note}` : note
      lines.push([
        detail ? `Electricity — ${detail}` : 'Electricity charges',
        Number(invoice.electricity_amount),
      ])
    }
    if (Number(invoice.maintenance_amount) > 0) {
      const note = invoice.maintenance_note?.trim()
      lines.push([
        note ? `Maintenance — ${note}` : 'Maintenance fee',
        Number(invoice.maintenance_amount),
      ])
    }
    if (Number(invoice.additional_charges) > 0) {
      lines.push(['Other charges', Number(invoice.additional_charges)])
    }
  } else {
    lines.push(['Payment received', Number(receipt.amount_paid)])
  }

  for (const [label, amount] of lines) {
    page.drawLine({
      start: { x: 40, y: y + 14 },
      end: { x: 555, y: y + 14 },
      thickness: 0.5,
      color: line,
    })
    drawText(page, label, 52, y, 10, font, ink)
    const amountText = formatInr(amount)
    const width = bold.widthOfTextAtSize(amountText, 10)
    drawText(page, amountText, 535 - width, y, 10, bold, ink)
    y -= 24
  }

  // Amount paid highlight
  y -= 10
  page.drawRectangle({
    x: 40,
    y: y - 36,
    width: 515,
    height: 48,
    color: accentSoft,
    borderColor: accent,
    borderWidth: 1.25,
  })
  drawText(page, 'Amount paid', 56, y - 12, 10, font, muted)
  const paidText = formatInr(Number(receipt.amount_paid))
  const paidWidth = bold.widthOfTextAtSize(paidText, 18)
  drawText(page, paidText, 535 - paidWidth, y - 28, 18, bold, accent)
  y -= 70

  if (invoice && Number(receipt.amount_paid) < Number(invoice.total_amount)) {
    drawText(
      page,
      `Partial payment against invoice total ${formatInr(Number(invoice.total_amount))}`,
      48,
      y,
      9,
      font,
      muted,
    )
    y -= 20
  }

  // Footer
  page.drawLine({
    start: { x: 40, y: 72 },
    end: { x: 555, y: 72 },
    thickness: 0.75,
    color: line,
  })
  drawText(page, 'Thank you for your payment.', 48, 52, 10, bold, ink)
  drawText(
    page,
    'This receipt is computer-generated by IIPL Office Rentals CRM. Keep it for your records.',
    48,
    36,
    8,
    font,
    muted,
  )

  return await doc.save()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error_code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }

  let receiptId: string | null = null
  let paymentId: string | null = null
  try {
    const body = await req.json()
    receiptId = body.receipt_id ?? null
    paymentId = body.payment_id ?? null
  } catch {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'Expected a JSON body with receipt_id or payment_id',
    })
  }

  if (!receiptId && !paymentId) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'A receipt_id or payment_id is required',
    })
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const query = serviceClient
    .from('receipt')
    .select(
      'id, office_owner_id, office_owner_name, office_unit_code, invoice_period, amount_paid, payment_gateway, transaction_ref, completed_at, document_ref, payment_id',
    )
  const { data: receipt, error: lookupError } = await (
    receiptId ? query.eq('id', receiptId) : query.eq('payment_id', paymentId)
  ).maybeSingle()

  if (lookupError) {
    console.error('receipt lookup failed:', lookupError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }
  if (!receipt) {
    return jsonResponse(404, { error_code: 'RECEIPT_NOT_FOUND', message: 'Receipt not found' })
  }

  if (receipt.document_ref) {
    return jsonResponse(200, {
      success: true,
      data: { id: receipt.id, document_ref: receipt.document_ref },
    })
  }

  // Pull invoice breakdown via the completed payment for a richer receipt layout.
  let invoice: InvoiceBreakdown | null = null
  const { data: payment } = await serviceClient
    .from('payment')
    .select(
      'invoice_id, invoice(rent_amount, electricity_amount, electricity_units, electricity_note, maintenance_amount, maintenance_note, additional_charges, total_amount, billing_cycle_key, billing_period_start, billing_period_end, office_unit(building(name)))',
    )
    .eq('id', receipt.payment_id)
    .maybeSingle()

  const inv = payment?.invoice as
    | {
        rent_amount: number
        electricity_amount: number
        electricity_units: number | null
        electricity_note: string | null
        maintenance_amount: number
        maintenance_note: string | null
        additional_charges: number
        total_amount: number
        billing_cycle_key: string
        billing_period_start: string
        billing_period_end: string
        office_unit?: { building?: { name?: string } | null } | null
      }
    | null
    | undefined

  if (inv) {
    invoice = {
      rent_amount: Number(inv.rent_amount),
      electricity_amount: Number(inv.electricity_amount ?? 0),
      electricity_units:
        inv.electricity_units == null ? null : Number(inv.electricity_units),
      electricity_note: inv.electricity_note,
      maintenance_amount: Number(inv.maintenance_amount ?? 0),
      maintenance_note: inv.maintenance_note,
      additional_charges: Number(inv.additional_charges),
      total_amount: Number(inv.total_amount),
      billing_cycle_key: inv.billing_cycle_key,
      billing_period_start: inv.billing_period_start,
      billing_period_end: inv.billing_period_end,
      building_name: inv.office_unit?.building?.name ?? null,
    }
  }

  try {
    const pdfBytes = await renderReceiptPdf(receipt as ReceiptRow, invoice)
    const objectKey = `${receipt.office_owner_id}/${crypto.randomUUID()}.pdf`

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(objectKey, pdfBytes, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('receipt upload failed:', uploadError.message)
      return jsonResponse(500, {
        error_code: 'UPLOAD_FAILED',
        message: 'Failed to store receipt PDF',
      })
    }

    const { error: updateError } = await serviceClient
      .from('receipt')
      .update({ document_ref: objectKey })
      .eq('id', receipt.id)

    if (updateError) {
      await serviceClient.storage.from(BUCKET).remove([objectKey])
      console.error('receipt document_ref update failed:', updateError.message)
      return jsonResponse(500, {
        error_code: 'UPDATE_FAILED',
        message: 'Failed to record receipt PDF path',
      })
    }

    return jsonResponse(200, { success: true, data: { id: receipt.id, document_ref: objectKey } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('receipt PDF render failed:', message)
    return jsonResponse(500, {
      error_code: 'RENDER_FAILED',
      message: 'Failed to render receipt PDF',
    })
  }
})
