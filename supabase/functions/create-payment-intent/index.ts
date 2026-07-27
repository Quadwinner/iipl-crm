/**
 * Edge Function: create-payment-intent (Task 16.10)
 * Requirement 9.1
 *
 * Server-side creation of a gateway payment intent/order for an Invoice. Creating a
 * Razorpay order or a UPI intent requires the gateway's server-side secret key, which must
 * never reach the browser — this function is the boundary that keeps those secrets server
 * side. It resolves the adapter for the requested gateway, calls its createPaymentIntent,
 * and durably records the PENDING attempt via the initiate_payment RPC (which authoritatively
 * re-validates ownership, non-PAID status, and amount bounds under the caller's own JWT/RLS).
 *
 * AUTHENTICATION: the caller's Supabase Auth JWT is required and forwarded, so the invoice
 * read and initiate_payment run under the caller's RLS context (owner isolation).
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, type GatewayType } from '../_shared/payments.ts'
import { upiAdapter } from '../webhooks-upi/adapter.ts'
import { razorpayAdapter } from '../webhooks-razorpay/adapter.ts'

const ADAPTERS = { UPI: upiAdapter, RAZORPAY: razorpayAdapter } as const

interface IntentRequest {
  invoice_id?: string
  gateway?: string
  amount?: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error_code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse(401, {
      error_code: 'UNAUTHORIZED',
      message: 'Missing authorization header',
    })
  }

  let body: IntentRequest
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error_code: 'INVALID_REQUEST', message: 'Expected a JSON body' })
  }

  const invoiceId = String(body.invoice_id ?? '')
  const gateway = String(body.gateway ?? '').toUpperCase() as GatewayType
  const amount = Number(body.amount)

  if (!invoiceId) {
    return jsonResponse(400, { error_code: 'INVALID_REQUEST', message: 'invoice_id is required' })
  }
  if (gateway !== 'UPI' && gateway !== 'RAZORPAY') {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'gateway must be UPI or RAZORPAY',
    })
  }
  if (!Number.isFinite(amount) || amount < 0.01) {
    return jsonResponse(400, {
      error_code: 'INVALID_REQUEST',
      message: 'amount must be at least 0.01',
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  // Caller-scoped client: RLS applies, so the invoice read and initiate_payment only
  // succeed for the invoice's own owner (Requirement 4.8).
  const userClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  // Early rejection so we don't create an orphan gateway order for an inaccessible or
  // already-paid invoice. initiate_payment remains the authoritative gate.
  const { data: invoice, error: invoiceError } = await userClient
    .from('invoice')
    .select('id, status')
    .eq('id', invoiceId)
    .maybeSingle()

  if (invoiceError) {
    console.error('invoice lookup failed:', invoiceError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }
  if (!invoice) {
    return jsonResponse(403, { error_code: 'PERMISSION_DENIED', message: 'Invoice not found' })
  }
  if (invoice.status === 'PAID') {
    return jsonResponse(409, {
      error_code: 'INVOICE_ALREADY_PAID',
      message: 'Invoice is already paid',
    })
  }

  // Create the gateway intent using server-side secrets.
  let intent
  try {
    intent = await ADAPTERS[gateway].createPaymentIntent(invoiceId, amount)
  } catch (e) {
    console.error('createPaymentIntent failed:', e instanceof Error ? e.message : e)
    return jsonResponse(502, {
      error_code: 'GATEWAY_ERROR',
      message: 'Failed to create payment intent',
    })
  }

  // Durably record the PENDING attempt (authoritative validation happens here).
  const { error: rpcError } = await userClient.rpc('initiate_payment', {
    p_invoice_id: invoiceId,
    p_gateway: gateway,
    p_amount: amount,
    p_transaction_ref: intent.reference,
  })

  if (rpcError) {
    const code = (rpcError as { code?: string }).code
    if (code === '42501') {
      return jsonResponse(403, {
        error_code: 'PERMISSION_DENIED',
        message: 'Not permitted to pay this invoice',
      })
    }
    if (code === '23505') {
      return jsonResponse(409, {
        error_code: 'INVOICE_ALREADY_PAID',
        message: 'Invoice is already paid',
      })
    }
    if (code === '22023') {
      return jsonResponse(400, { error_code: 'INVALID_REQUEST', message: rpcError.message })
    }
    console.error('initiate_payment failed:', rpcError.message)
    return jsonResponse(500, {
      error_code: 'INTERNAL_ERROR',
      message: 'Failed to initiate payment',
    })
  }

  return jsonResponse(201, {
    success: true,
    data: {
      reference: intent.reference,
      gateway: intent.gateway,
      invoice_id: intent.invoiceId,
      amount: intent.amount,
      gateway_data: intent.gatewayData ?? {},
    },
  })
})
