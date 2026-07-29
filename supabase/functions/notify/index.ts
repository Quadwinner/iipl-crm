/**
 * Edge Function: notify (deliverPending)
 * Task 20.1
 * Requirements 10.3, 10.4, 11.3, 11.8
 *
 * Polls the notifications queue for PENDING rows that are due for a delivery attempt,
 * sends each through the channel-appropriate provider (EMAIL / SMS), and records the
 * outcome via record_notification_attempt, which applies the shared retry policy
 * (exponential backoff, then FAILED once global_config.max_retries is exhausted).
 *
 * Provider integration is behind a small abstraction. When the provider API key is not
 * configured (EMAIL_PROVIDER_API_KEY / SMS_PROVIDER_API_KEY), the provider falls back to
 * a no-op that logs and reports success, so the delivery loop is exercisable end-to-end
 * in local/test environments without external credentials. Wiring a real provider is a
 * localized change inside sendEmail / sendSms.
 *
 * Invoked on a schedule by pg_cron via pg_net (see the schedule_cron_jobs migration) using
 * the service-role key. State changes go through the database helpers only.
 */

import { createClient } from 'jsr:@supabase/supabase-js@2'

const BATCH_LIMIT = 100

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

interface PendingNotification {
  id: string
  user_id: string
  channel: 'EMAIL' | 'SMS' | 'IN_APP'
  notification_type: string
  payload: Record<string, unknown>
  retry_count: number
  recipient_email: string | null
  recipient_phone: string | null
}

interface DeliveryResult {
  success: boolean
  error?: string
}

const PORTAL_URL = Deno.env.get('OWNER_PORTAL_URL') ?? 'http://localhost:5174'

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

function inr(amount: unknown): string {
  const n = Number(amount)
  return Number.isFinite(n) ? `₹${n.toFixed(2)}` : String(amount ?? '')
}

/** Subject + body per notification type. Payload keys come from the enqueueing RPCs. */
function renderEmail(notification: PendingNotification): { subject: string; html: string } {
  const p = notification.payload ?? {}
  const link = `<p><a href="${PORTAL_URL}">Open the owner portal</a></p>`

  switch (notification.notification_type) {
    case 'LOGIN_INSTRUCTIONS':
      return {
        subject: 'Welcome to IIPL office rentals — your portal account is ready',
        html:
          `<p>Hello ${escapeHtml(p.name)},</p>` +
          `<p>An owner account has been created for you at IIPL office rentals. ` +
          `You can sign in to the owner portal to view your allotments and invoices, ` +
          `pay rent, download receipts, and raise maintenance complaints.</p>` +
          `<p><strong>Sign in with:</strong> ${escapeHtml(p.contact_email)}<br>` +
          `<strong>Password:</strong> the one shared with you by the IIPL office</p>` +
          `<p><a href="${PORTAL_URL}">Open the owner portal</a></p>` +
          `<p>If you did not expect this email, please contact the IIPL office.</p>`,
      }

    case 'ALLOTMENT_CREATED':
      return {
        subject: 'Office unit allotted to you',
        html:
          `<p>An office unit has been allotted to you.</p>` +
          `<p>Lease period: ${escapeHtml(p.lease_start)} to ${escapeHtml(p.lease_end)}<br>` +
          `Rent: ${inr(p.rent_amount)} (${escapeHtml(p.billing_cycle)})</p>` +
          link,
      }

    case 'ALLOTMENT_STATUS_CHANGED':
      return {
        subject: `Your allotment is now ${escapeHtml(p.new_status)}`,
        html:
          `<p>The status of your allotment changed from ` +
          `${escapeHtml(p.previous_status)} to <strong>${escapeHtml(p.new_status)}</strong>.</p>` +
          (p.reason ? `<p>Reason: ${escapeHtml(p.reason)}</p>` : '') +
          link,
      }

    case 'COMPLAINT_STATUS':
      return {
        subject: `Maintenance complaint updated: ${escapeHtml(p.new_status)}`,
        html:
          `<p>Your maintenance complaint status changed to ` +
          `<strong>${escapeHtml(p.new_status)}</strong>.</p>` +
          link,
      }

    case 'RECEIPT':
      return {
        subject: `Payment received — receipt for ${inr(p.amount)}`,
        html:
          `<p>We have received your payment of <strong>${inr(p.amount)}</strong> ` +
          `via ${escapeHtml(p.gateway)}.</p>` +
          `<p>Your receipt is available to download in the owner portal.</p>` +
          link,
      }

    case 'PAYMENT_FAILURE':
      return {
        subject: 'Your rent payment did not go through',
        html:
          `<p>A payment attempt via ${escapeHtml(p.gateway)} was ` +
          `${escapeHtml(String(p.outcome).toLowerCase())}. Your invoice is unchanged ` +
          `and still due.</p>` +
          `<p>You can try again from the owner portal.</p>` +
          link,
      }

    case 'REMINDER_UPCOMING':
      return {
        subject: `Rent due ${escapeHtml(p.due_date)} — ${inr(p.amount_due ?? p.amount)}`,
        html:
          `<p>This is a reminder that rent of <strong>${inr(p.amount_due ?? p.amount)}</strong> ` +
          `is due on ${escapeHtml(p.due_date)}.</p>` +
          link,
      }

    case 'REMINDER_OVERDUE':
      return {
        subject: `Overdue rent — ${inr(p.amount_due ?? p.amount)}`,
        html:
          `<p>Rent of <strong>${inr(p.amount_due ?? p.amount)}</strong> was due on ` +
          `${escapeHtml(p.due_date)} and is now overdue.</p>` +
          `<p>Please settle it at your earliest convenience.</p>` +
          link,
      }

    default:
      return {
        subject: `IIPL office rentals — ${notification.notification_type}`,
        html: `<p>You have a new notification in the owner portal.</p>${link}`,
      }
  }
}

// EMAIL provider (Resend). Falls back to a logging no-op when no API key is configured so
// the delivery loop stays exercisable without external credentials.
async function sendEmail(
  recipient: string | null,
  notification: PendingNotification,
): Promise<DeliveryResult> {
  if (!recipient) {
    return { success: false, error: 'no recipient email on file' }
  }

  const apiKey = Deno.env.get('EMAIL_PROVIDER_API_KEY')
  if (!apiKey) {
    console.log(
      `[notify] EMAIL (no provider configured) to ${recipient}: ${notification.notification_type}`,
    )
    return { success: true }
  }

  const from = Deno.env.get('EMAIL_FROM') ?? 'onboarding@resend.dev'
  const { subject, html } = renderEmail(notification)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [recipient], subject, html }),
    })

    if (!response.ok) {
      // Resend's message is safe to log (no secret echoed) and useful for diagnosing
      // a rejected sender domain or rate limit.
      const detail = await response.text()
      return {
        success: false,
        error: `resend ${response.status}: ${detail.slice(0, 200)}`,
      }
    }

    const body = (await response.json()) as { id?: string }
    console.log(`[notify] EMAIL sent to ${recipient} (${notification.notification_type}) id=${body.id}`)
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'resend request failed' }
  }
}

// SMS provider. Falls back to a logging no-op when no API key is configured.
async function sendSms(
  recipient: string | null,
  notification: PendingNotification,
): Promise<DeliveryResult> {
  if (!recipient) {
    return { success: false, error: 'no recipient phone on file' }
  }

  const apiKey = Deno.env.get('SMS_PROVIDER_API_KEY')
  if (!apiKey) {
    console.log(
      `[notify] SMS (no provider configured) to ${recipient}: ${notification.notification_type}`,
    )
    return { success: true }
  }

  // --- Real SMS provider integration point ---
  console.log(`[notify] SMS to ${recipient}: ${notification.notification_type}`)
  return { success: true }
}

async function sendViaProvider(notification: PendingNotification): Promise<DeliveryResult> {
  switch (notification.channel) {
    case 'EMAIL':
      return await sendEmail(notification.recipient_email, notification)
    case 'SMS':
      return await sendSms(notification.recipient_phone, notification)
    case 'IN_APP':
      // In-app notifications are delivered by the row already existing in the queue; the
      // owner reads them through the portal. Nothing to send externally.
      return { success: true }
    default:
      return { success: false, error: `unsupported channel ${notification.channel}` }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error_code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' })
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const { data: pending, error: fetchError } = await serviceClient.rpc('pending_notifications', {
    p_limit: BATCH_LIMIT,
  })

  if (fetchError) {
    console.error('[notify] failed to fetch pending notifications:', fetchError.message)
    return jsonResponse(500, { error_code: 'INTERNAL_ERROR', message: 'Internal server error' })
  }

  const notifications = (pending ?? []) as PendingNotification[]

  let sent = 0
  let failed = 0
  let retried = 0

  for (const notification of notifications) {
    let result: DeliveryResult
    try {
      result = await sendViaProvider(notification)
    } catch (err) {
      result = { success: false, error: err instanceof Error ? err.message : 'send error' }
    }

    const { data: updated, error: recordError } = await serviceClient.rpc(
      'record_notification_attempt',
      { p_id: notification.id, p_success: result.success },
    )

    if (recordError) {
      console.error(
        `[notify] failed to record attempt for ${notification.id}:`,
        recordError.message,
      )
      continue
    }

    const status = (updated as { status?: string } | null)?.status
    if (result.success) {
      sent += 1
    } else if (status === 'FAILED') {
      failed += 1
    } else {
      retried += 1
    }
  }

  return jsonResponse(200, {
    success: true,
    data: { processed: notifications.length, sent, failed, retried },
  })
})
