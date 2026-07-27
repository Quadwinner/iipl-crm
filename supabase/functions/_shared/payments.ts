/**
 * Shared payment-gateway plumbing for the UPI / Razorpay Edge Functions.
 *
 * Mirrors the canonical `PaymentGatewayAdapter` interface in
 * `@itoby/shared` (packages/shared/src/payments/adapter.ts) on the Deno side. Kept
 * dependency-free (Web Crypto + fetch only) so it can be imported by every payment
 * function without an import map.
 */

// ── Adapter contract (mirror of @itoby/shared) ──────────────────────────────
export type GatewayType = 'UPI' | 'RAZORPAY'
export type PaymentOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface PaymentIntent {
  reference: string
  gateway: GatewayType
  invoiceId: string
  amount: number
  gatewayData?: Record<string, unknown>
}

export interface CallbackPayload {
  transactionRef: string
  invoiceId: string
  amount: number
  outcome: PaymentOutcome
  gatewayTimestamp: string
}

export interface VerificationResult {
  valid: boolean
  reason?: string
}

export interface PaymentGatewayAdapter {
  createPaymentIntent(invoiceId: string, amount: number): Promise<PaymentIntent>
  verifyCallback(
    rawBody: Uint8Array | string,
    headers: Record<string, string>,
  ): Promise<VerificationResult> | VerificationResult
  parseCallback(rawBody: Uint8Array | string): CallbackPayload
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-upi-signature, x-razorpay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Crypto ─────────────────────────────────────────────────────────────────
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function asBytes(data: Uint8Array | string): Uint8Array {
  return typeof data === 'string' ? new TextEncoder().encode(data) : data
}

export async function hmacSha256Hex(secret: string, data: Uint8Array | string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, asBytes(data))
  return toHex(new Uint8Array(sig))
}

export async function sha256Hex(data: Uint8Array | string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', asBytes(data))
  return toHex(new Uint8Array(digest))
}

/** Length-independent, constant-time string comparison for signatures. */
export function constantTimeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const ab = enc.encode(a)
  const bb = enc.encode(b)
  if (ab.length !== bb.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < ab.length; i++) {
    diff |= ab[i] ^ bb[i]
  }
  return diff === 0
}

// ── Minimal client surface (avoids importing supabase-js into _shared) ───────
export interface PaymentDbClient {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): Promise<{ data: unknown; error: { message: string } | null }>
  from(table: string): {
    insert(values: Record<string, unknown>): Promise<{ error: { message: string } | null }>
  }
}

/** Records a callback whose signature failed verification (Requirement 9.7). */
export async function recordVerificationFailure(
  client: PaymentDbClient,
  gateway: GatewayType,
  rawBodyHash: string,
  reason: string,
): Promise<void> {
  const { error } = await client
    .from('payment_verification_failures')
    .insert({ gateway, raw_body_hash: rawBodyHash, reason })
  if (error) {
    console.error('failed to record verification failure:', error.message)
  }
}

/**
 * Fire-and-forget trigger for the follow-up receipt-pdf Edge Function that renders the
 * Receipt PDF and populates receipt.document_ref. The Receipt ROW already exists (created
 * atomically in handle_payment_callback), so a failure here never affects the payment
 * outcome — the PDF render is simply retried on the next successful callback or manual
 * invocation. Errors are logged, not surfaced.
 */
export async function triggerReceiptRender(receiptId: string): Promise<void> {
  try {
    const baseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!baseUrl || !serviceKey) {
      return
    }
    const res = await fetch(`${baseUrl}/functions/v1/receipt-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ receipt_id: receiptId }),
    })
    if (!res.ok) {
      console.error('receipt-pdf render trigger returned', res.status)
    }
  } catch (err) {
    console.error('receipt-pdf render trigger failed:', err)
  }
}

/** Invokes the atomic state-changing RPC with the service role. */
export async function callHandlePaymentCallback(
  client: PaymentDbClient,
  gateway: GatewayType,
  payload: CallbackPayload,
): Promise<{ data: unknown; error: { message: string } | null }> {
  return await client.rpc('handle_payment_callback', {
    p_gateway: gateway,
    p_transaction_ref: payload.transactionRef,
    p_invoice_id: payload.invoiceId,
    p_amount: payload.amount,
    p_outcome: payload.outcome,
    p_gateway_timestamp: payload.gatewayTimestamp,
  })
}
