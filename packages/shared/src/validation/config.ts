import { z } from 'zod'

/**
 * Bounds mirror the `global_config` / `file_storage_config` check constraints and the
 * configure_* RPC guards exactly (Requirements 5.8, 8.2, 11.6, 11.9, 13.4), so the client
 * rejects the same values the database would reject with errcode 22023.
 */

function positiveWhole(label: string, unit: string) {
  return z
    .number({ error: `Enter ${label}.` })
    .int(`${label} must be a whole number of ${unit}.`)
    .positive(`${label} must be greater than zero.`)
}

export const securityPolicySchema = z.object({
  session_timeout_minutes: positiveWhole('the session timeout', 'minutes'),
  lockout_threshold: positiveWhole('the lockout threshold', 'attempts'),
  lockout_duration_minutes: positiveWhole('the lockout duration', 'minutes'),
})

export type SecurityPolicyInput = z.infer<typeof securityPolicySchema>

export const reminderSettingsSchema = z.object({
  reminder_lead_time_days: positiveWhole('the reminder lead time', 'days'),
  reminder_frequency_days: positiveWhole('the reminder frequency', 'days'),
})

export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>

/** A zero-day grace period is valid: the Invoice is then due on the billing cycle date. */
export const paymentGracePeriodSchema = z.object({
  payment_grace_period_days: z
    .number({ error: 'Enter the payment grace period.' })
    .int('The payment grace period must be a whole number of days.')
    .min(0, 'The payment grace period cannot be negative.'),
})

export type PaymentGracePeriodInput = z.infer<typeof paymentGracePeriodSchema>

export const FILE_EXTENSION_MAX = 20
export const MIME_TYPE_MAX = 255

export const fileTypeConfigSchema = z.object({
  file_extension: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter a file extension.')
    .max(FILE_EXTENSION_MAX, `Extension must not exceed ${FILE_EXTENSION_MAX} characters.`)
    .regex(/^[a-z0-9]+$/, 'Use letters and digits only, without a leading dot.'),
  mime_type: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Enter a MIME type.')
    .max(MIME_TYPE_MAX, `MIME type must not exceed ${MIME_TYPE_MAX} characters.`),
  file_type_accepted: z.boolean(),
  max_file_size_mb: positiveWhole('the maximum file size', 'megabytes'),
})

export type FileTypeConfigInput = z.infer<typeof fileTypeConfigSchema>
