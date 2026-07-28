/**
 * Edge Function: invoice-pdf
 * Renders a GST Tax Invoice PDF for a billing invoice and stores it in the invoices bucket.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { renderGstInvoicePdf } from '../_shared/gst-invoice-pdf.ts'
import { loadGstInvoiceInput } from '../_shared/invoice-pdf-data.ts'

const BUCKET = 'invoices'

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

  let invoiceId: string | null = null
  try {
    const body = await req.json()
    invoiceId = body.invoice_id ?? null
  } catch {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'Expected a JSON body with invoice_id',
    })
  }

  if (!invoiceId) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'invoice_id is required',
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, { error_code: 'UNAUTHORIZED', message: 'Authorization required' })
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { data: invoiceRow, error: accessError } = await userClient
    .from('invoice')
    .select('id, document_ref, office_owner_id')
    .eq('id', invoiceId)
    .maybeSingle()

  if (accessError || !invoiceRow) {
    return jsonResponse(403, { error_code: 'FORBIDDEN', message: 'Invoice not found or access denied' })
  }

  if (invoiceRow.document_ref) {
    return jsonResponse(200, {
      success: true,
      data: { invoice_id: invoiceRow.id, document_ref: invoiceRow.document_ref },
    })
  }

  try {
    const loaded = await loadGstInvoiceInput(serviceClient, invoiceId)
    const pdfBytes = await renderGstInvoicePdf(loaded.input)
    const objectKey = `${loaded.ownerId}/${crypto.randomUUID()}.pdf`

    const { error: uploadError } = await serviceClient.storage
      .from(BUCKET)
      .upload(objectKey, pdfBytes, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('invoice upload failed:', uploadError.message)
      return jsonResponse(500, { error_code: 'UPLOAD_FAILED', message: 'Failed to store invoice PDF' })
    }

    const { error: updateError } = await serviceClient
      .from('invoice')
      .update({ document_ref: objectKey })
      .eq('id', invoiceId)

    if (updateError) {
      await serviceClient.storage.from(BUCKET).remove([objectKey])
      console.error('invoice document_ref update failed:', updateError.message)
      return jsonResponse(500, {
        error_code: 'UPDATE_FAILED',
        message: 'Failed to record invoice PDF path',
      })
    }

    return jsonResponse(200, {
      success: true,
      data: { invoice_id: invoiceId, document_ref: objectKey },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('invoice PDF render failed:', message)
    return jsonResponse(500, { error_code: 'RENDER_FAILED', message: 'Failed to render invoice PDF' })
  }
})
