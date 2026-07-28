/**
 * Edge Function: receipt-pdf
 * Task 18.2 (follow-up async step)
 * Requirements 10.1
 *
 * Renders a GST Tax Invoice PDF (with payment confirmation) for a completed payment,
 * stores it in the private `receipts` bucket, and records the path on receipt.document_ref.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { renderGstInvoicePdf } from '../_shared/gst-invoice-pdf.ts'
import { loadGstInvoiceInput } from '../_shared/invoice-pdf-data.ts'

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
      'id, office_owner_id, document_ref, payment_id, amount_paid, payment_gateway, transaction_ref, completed_at',
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

  const { data: payment } = await serviceClient
    .from('payment')
    .select('invoice_id')
    .eq('id', receipt.payment_id)
    .maybeSingle()

  if (!payment?.invoice_id) {
    return jsonResponse(500, {
      error_code: 'INVOICE_NOT_FOUND',
      message: 'Payment has no linked invoice',
    })
  }

  try {
    const loaded = await loadGstInvoiceInput(serviceClient, payment.invoice_id, {
      amount: Number(receipt.amount_paid),
      gateway: receipt.payment_gateway,
      transactionRef: receipt.transaction_ref,
      paidAt: receipt.completed_at,
    })

    const pdfBytes = await renderGstInvoicePdf(loaded.input)
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
