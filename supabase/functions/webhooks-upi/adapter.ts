/**
 * UPI PaymentGatewayAdapter (Task 16.4, Requirement 9.5).
 *
 * Callback authenticity is a shared-secret HMAC-SHA256 over the raw request body,
 * compared in constant time against the `X-UPI-Signature` header. The shared secret is
 * read from the Edge Function secrets store (`UPI_SHARED_SECRET`) and never leaves the
 * server. Implements the canonical adapter contract mirrored in `_shared/payments.ts`.
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

const OUTCOMES: readonly PaymentOutcome[] = ['SUCCESS', 'FAILED', 'CANCELLED']

function decode(rawBody: Uint8Array | string): string {
  return typeof rawBody === 'string' ? rawBody : new TextDecoder().decode(rawBody)
}

export const upiAdapter: PaymentGatewayAdapter = {
  createPaymentIntent(invoiceId: string, amount: number): Promise<PaymentIntent> {
    const reference = `upi_${crypto.randomUUID()}`
    const vpa = Deno.env.get('UPI_PAYEE_VPA') ?? ''
    const payeeName = Deno.env.get('UPI_PAYEE_NAME') ?? 'IIPL'
    // Standard UPI deep-link intent the client renders as a QR / app handoff.
    const upiUri =
      `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}` +
      `&am=${amount.toFixed(2)}&tr=${encodeURIComponent(reference)}&cu=INR`
    return Promise.resolve({
      reference,
      gateway: 'UPI',
      invoiceId,
      amount,
      gatewayData: { upiUri },
    })
  },

  async verifyCallback(
    rawBody: Uint8Array | string,
    headers: Record<string, string>,
  ): Promise<VerificationResult> {
    const secret = Deno.env.get('UPI_SHARED_SECRET')
    if (!secret) {
      return { valid: false, reason: 'server misconfigured' }
    }
    const provided = headers['x-upi-signature'] ?? ''
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
    const outcome = String(body.outcome ?? '').toUpperCase() as PaymentOutcome
    if (!OUTCOMES.includes(outcome)) {
      throw new Error('unrecognized UPI outcome')
    }
    return {
      transactionRef: String(body.transaction_ref),
      invoiceId: String(body.invoice_id),
      amount: Number(body.amount),
      outcome,
      gatewayTimestamp: body.gateway_timestamp
        ? String(body.gateway_timestamp)
        : new Date().toISOString(),
    }
  },
}
