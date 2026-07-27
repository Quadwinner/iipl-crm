/**
 * Edge Function: webhooks-upi (Task 16.4)
 * Requirements 9.2, 9.3, 9.5, 9.7, 9.8
 *
 * Inbound UPI payment callback receiver. AUTHENTICATION: the shared-secret HMAC over the
 * raw request body is verified (constant-time) against the `X-UPI-Signature` header BEFORE
 * anything touches the database. On verification failure the attempt is recorded in
 * payment_verification_failures and the request is rejected with 400 — no Invoice/Payment
 * change. On success the state change is delegated to the atomic `handle_payment_callback`
 * RPC (idempotent on (gateway, transaction_ref)), invoked with the service-role key.
 *
 * Status contract (UPI PSPs retry on non-2xx):
 *   200 — verified and durably handled (success, recorded failure, or duplicate-discard)
 *   400 — signature verification failed (recorded, do not retry)
 *   500 — genuine internal error (retry desirable)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  callHandlePaymentCallback,
  corsHeaders,
  jsonResponse,
  recordVerificationFailure,
  sha256Hex,
  triggerReceiptRender,
  type PaymentDbClient,
} from '../_shared/payments.ts'
import { upiAdapter } from './adapter.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error_code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }

  // Read the raw bytes ONCE — parsing to JSON and re-serializing would change the bytes
  // and break HMAC verification.
  const rawBody = new Uint8Array(await req.arrayBuffer())

  const headers: Record<string, string> = {}
  for (const [k, v] of req.headers) {
    headers[k.toLowerCase()] = v
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  ) as unknown as PaymentDbClient

  // 1. Authenticate before any state change (Requirement 9.5).
  const verification = await upiAdapter.verifyCallback(rawBody, headers)
  if (!verification.valid) {
    // Record the failure (only a hash of the body, never the raw payload) — Requirement 9.7.
    await recordVerificationFailure(
      serviceClient,
      'UPI',
      await sha256Hex(rawBody),
      verification.reason ?? 'verification failed',
    )
    return jsonResponse(400, {
      error_code: 'INVALID_SIGNATURE',
      message: 'Callback verification failed',
    })
  }

  // 2. Parse the verified payload.
  let payload
  try {
    payload = upiAdapter.parseCallback(rawBody)
  } catch {
    return jsonResponse(400, {
      error_code: 'INVALID_PAYLOAD',
      message: 'Malformed callback payload',
    })
  }

  // 3. Delegate the atomic state change to Postgres (Requirements 9.2, 9.3, 9.8).
  const { data, error } = await callHandlePaymentCallback(serviceClient, 'UPI', payload)
  if (error) {
    console.error('handle_payment_callback failed:', error.message)
    return jsonResponse(500, {
      error_code: 'INTERNAL_ERROR',
      message: 'Failed to process callback',
    })
  }

  // On a newly completed Payment, kick off the async Receipt PDF render (Task 18.2).
  const result = data as { result?: string; receipt_id?: string } | null
  if (result?.result === 'completed' && result.receipt_id) {
    await triggerReceiptRender(result.receipt_id)
  }

  return jsonResponse(200, { success: true, result: data })
})
