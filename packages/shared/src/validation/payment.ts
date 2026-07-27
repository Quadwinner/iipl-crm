import { z } from 'zod'
import { PAYMENT_GATEWAYS } from '../types/domain'

/** Payment amount bounds mirror requirements.md (Requirement 9.1) and `initiate_payment`. */
export const PAYMENT_AMOUNT_MIN = 0.01

/**
 * The upper bound is the Invoice's outstanding due, which is per-invoice, so the schema is
 * built per form. `initiate_payment` re-validates both bounds server-side (Requirement 9.6).
 */
export function paymentInitiationSchema(outstandingDue: number) {
  return z.object({
    gateway: z.enum(PAYMENT_GATEWAYS, { error: 'Select a payment method.' }),
    amount: z
      .number({ error: 'Enter an amount.' })
      .min(PAYMENT_AMOUNT_MIN, `Amount must be at least ${PAYMENT_AMOUNT_MIN}.`)
      .max(outstandingDue, `Amount must not exceed the outstanding due of ${outstandingDue}.`),
  })
}

export type PaymentInitiationInput = z.infer<ReturnType<typeof paymentInitiationSchema>>
