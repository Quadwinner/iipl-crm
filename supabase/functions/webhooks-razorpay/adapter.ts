/**
 * Razorpay PaymentGatewayAdapter (Task 16.5, Requirement 9.5).
 *
 * Callback authenticity follows Razorpay's documented webhook scheme: HMAC-SHA256 of the
 * raw request body using the configured webhook secret (`RAZORPAY_WEBHOOK_SECRET`),
 * compared in constant time against the `X-Razorpay-Signature` header. Intent creation
 * calls the Razorpay Orders API with the server-side key id/secret
 * (`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`), which never reach the browser. Implements
 * the canonical adapter contract mirrored in `_shared/payments.ts`.
 */

import {
  constantTimeEqual,
  hmacSha256Hex,
  type CallbackPayload,
  type PaymentGatewayAdapter,
  type PaymentIntent,
  type PaymentOutcome,
  type VerificationResult,
} from '../_shared/payments.ts'

function decode(rawBody: Uint8Array | string): string {
  return typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(rawBody)
}

// Razorpay webhook event -> normalized outcome.
function outcomeForEvent(event: string): PaymentOutcome {
  if (event === 'payment.captured' || event === 'order.paid') {
    return 'SUCCESS'
  }
  if (event === 'payment.failed') {
    return 'FAILED'
  }
  return 'CANCELLED'
}

export const razorpayAdapter: PaymentGatewayAdapter = {
  async createPaymentIntent(invoiceId: string, amount: number): Promise<PaymentIntent> {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not configured')
    }

    // Razorpay works in the smallest currency unit (paise).
    const amountPaise = Math.round(amount * 100)
    const auth = btoa(`${keyId}:${keySecret}`)
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        notes: { invoice_id: invoiceId },
      }),
    })

    if (!res.ok) {
      throw new Error(`Razorpay order creation failed (${res.status})`)
    }
    const order = await res.json()
    return {
      reference: String(order.id),
      gateway: 'RAZORPAY',
      invoiceId,
      amount,
      // keyId is the publishable identifier used by Razorpay Checkout; the secret is not exposed.
      gatewayData: { orderId: order.id, keyId, amountPaise },
    }
  },

  async verifyCallback(
    rawBody: Uint8Array | string,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!secret) {
      return { valid: false, reason: 'server misconfigured' }
    }
    const provided = headers['x-razorpay-signature'] ?? ''
    if (!provided) {
      return { valid: false, reason: 'missing signature' }
    }
    const expected = await hmacSha256Hex(secret, rawBody)
    return constantTimeEqual(provided, expected)
      ? { valid: true }
      : { valid: false, reason: 'signature mismatch' }
  },

  parseCallback(rawBody: Uint8Array | string): CallbackPayload {
    const body = JSON.parse(decode(rawBody))
    const event = String(body.event ?? '')
    const entity = body?.payload?.payment?.entity ?? {}
    const invoiceId = entity?.notes?.invoice_id
    if (!entity.id || !invoiceId) {
      throw new Error('missing Razorpay payment entity fields')
    }
    return {
      transactionRef: String(entity.id),
      invoiceId: String(invoiceId),
      amount: Number(entity.amount) / 100, // paise -> rupees
      outcome: outcomeForEvent(event),
      gatewayTimestamp: entity.created_at
        ? new Date(Number(entity.created_at) * 1000).toISOString()
        : new Date().toISOString(),
    }
  },
}
