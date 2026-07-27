/**
 * Payment gateway abstraction (Task 16.4, Requirement 9.5).
 *
 * The canonical `PaymentGatewayAdapter` contract shared across the codebase. Both the
 * UPI and Razorpay implementations (in the `webhooks-upi` / `webhooks-razorpay` Edge
 * Functions) and the `create-payment-intent` Edge Function implement this shape, so the
 * Payment Service logic — intent creation, callback verification, idempotency — is
 * gateway-agnostic.
 *
 * These are pure types with no runtime dependencies so they can describe the contract on
 * the portal (browser) side; the Deno Edge Functions mirror the same shape.
 */

import type { GatewayType } from '../types/domain'

/** Outcome reported by a gateway for a payment attempt. */
export type PaymentOutcome = 'SUCCESS' | 'FAILED' | 'CANCELLED'

/** A gateway-created intent/order the client uses to complete the payment. */
export interface PaymentIntent {
  /** Gateway reference / order id — becomes the Payment's transaction_ref. */
  reference: string
  gateway: GatewayType
  invoiceId: string
  amount: number
  /** Optional gateway-specific fields safe to expose to the client (e.g. order id, UPI URI). */
  gatewayData?: Record<string, unknown>
}

/** Normalized payload parsed from a gateway callback body. */
export interface CallbackPayload {
  transactionRef: string
  invoiceId: string
  amount: number
  outcome: PaymentOutcome
  gatewayTimestamp: string
}

/** Result of authenticating a callback's signature. */
export interface VerificationResult {
  valid: boolean
  /** Optional non-sensitive reason, recorded on failure. */
  reason?: string
}

export interface PaymentGatewayAdapter {
  /** Creates a gateway payment intent/order using server-side secrets. */
  createPaymentIntent(invoiceId: string, amount: number): Promise<PaymentIntent>
  /** Verifies a callback's signature over the raw request bytes before any state change. */
  verifyCallback(
    rawBody: Uint8Array | string,
    headers: Record<string, string>,
  ): Promise<VerificationResult> | VerificationResult
  /** Parses a verified callback body into the normalized payload. */
  parseCallback(rawBody: Uint8Array | string): CallbackPayload
}
