/**
 * Edge Function: receipt-pdf
 * Task 18.2 (follow-up async step)
 * Requirements 10.1
 *
 * Renders the PDF for an already-generated Receipt and stores it in the private
 * `receipts` bucket, then records the object path in receipt.document_ref. The Receipt
 * ROW is created atomically with the completed Payment inside handle_payment_callback
 * (so it is downloadable immediately per Requirement 10.2); this function only fills in
 * the rendered PDF afterwards. It is invoked with the service-role key from the payment
 * webhook after a successful callback, and is idempotent — a Receipt whose document_ref
 * is already set is left untouched.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

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
}

async function renderReceiptPdf(receipt: ReceiptRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4 portrait
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const ink = rgb(0.1, 0.1, 0.12)

  let y = 780
  page.drawText('Payment Receipt', { x: 50, y, size: 22, font: bold, color: ink })
  y -= 40

  const rows: Array<[string, string]> = [
    ['Receipt ID', receipt.id],
    ['Office Owner', receipt.office_owner_name],
    ['Office Unit', receipt.office_unit_code],
    ['Invoice Period', receipt.invoice_period],
    ['Amount Paid', receipt.amount_paid.toFixed(2)],
    ['Payment Gateway', receipt.payment_gateway],
    ['Transaction Reference', receipt.transaction_ref ?? '-'],
    ['Payment Completed', new Date(receipt.completed_at).toISOString()],
  ]

  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: 50, y, size: 12, font: bold, color: ink })
    page.drawText(value, { x: 230, y, size: 12, font, color: ink })
    y -= 26
  }

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
      'id, office_owner_id, office_owner_name, office_unit_code, invoice_period, amount_paid, payment_gateway, transaction_ref, completed_at, document_ref',
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

  // Idempotent: the PDF is rendered at most once per Receipt.
  if (receipt.document_ref) {
    return jsonResponse(200, {
      success: true,
      data: { id: receipt.id, document_ref: receipt.document_ref },
    })
  }

  const pdfBytes = await renderReceiptPdf(receipt as ReceiptRow)

  // Opaque, UUID-based object key scoped under the owning office_owner.
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
    // Roll back the orphaned Storage object so a failed update leaves nothing behind.
    await serviceClient.storage.from(BUCKET).remove([objectKey])
    console.error('receipt document_ref update failed:', updateError.message)
    return jsonResponse(500, {
      error_code: 'UPDATE_FAILED',
      message: 'Failed to record receipt PDF path',
    })
  }

  return jsonResponse(200, { success: true, data: { id: receipt.id, document_ref: objectKey } })
})
