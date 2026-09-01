import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import {
  BUDGET_RANGES,
  leadErrorMessage,
  leadFieldErrors,
  leadFormSchema,
  submitLead,
  type LeadFieldErrors,
} from '@itoby/shared'
import { useServices } from '@/features/site/use-content'
import { supabase } from '@/lib/supabase'

type Source = 'CONTACT_FORM' | 'QUOTE_REQUEST'

const BUDGETS = BUDGET_RANGES

/**
 * The only public write path into `leads`.
 *
 * `submit_lead` is security definer and rate limited to five per email per
 * hour; the table itself has no INSERT policy, so nothing here can reach it
 * another way. A 53400 comes back with a message written for the visitor, so
 * it is surfaced verbatim rather than replaced with a generic failure.
 */
export function LeadForm({ source, cta }: { source: Source; cta: string }) {
  const services = useServices()
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({})
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    service_interest: '',
    budget_range: '',
    message: '',
  })

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // The same bounds submit_lead enforces, checked before the round trip so a
    // bad field lands next to the input rather than as one message at the top.
    const parsed = leadFormSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(leadFieldErrors(parsed.error))
      return
    }

    setBusy(true)
    try {
      await submitLead(supabase(), {
        ...parsed.data,
        source,
        page_path: window.location.pathname,
      })
      setSent(true)
    } catch (cause) {
      // Only the codes submit_lead raises on purpose are shown; anything else is
      // a fault, and a raw database message would leak schema and read as a crash.
      setError(leadErrorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  /** Renders a field's message and wires the aria attributes that go with it. */
  function fieldProps(name: keyof LeadFieldErrors) {
    const message = fieldErrors[name]
    return {
      'aria-invalid': message ? true : undefined,
      'aria-describedby': message ? `${name}-error` : undefined,
    } as const
  }

  if (sent) {
    return (
      <div className="card p-10 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[color:var(--lime)]/15">
          <Check className="size-6 text-[color:var(--lime)]" aria-hidden="true" />
        </span>
        <h3 className="mt-6 text-xl font-semibold tracking-tight">Thanks — that reached us.</h3>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fg-2)]">
          We read everything that comes in and reply within one business day.
        </p>
      </div>
    )
  }

  const field =
    'w-full rounded-lg border border-[color:var(--line)] bg-white/[0.03] px-4 py-3 text-sm outline-none transition-colors placeholder:text-[color:var(--fg-2)]/60 focus:border-[color:var(--lime)]/60'

  return (
    <form onSubmit={submit} className="card space-y-4 p-7 sm:p-8" noValidate>
      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow !text-[10px]">Name *</span>
          <input
            className={`${field} mt-2`}
            value={form.full_name}
            onChange={set('full_name')}
            placeholder="Your name"
            {...fieldProps('full_name')}
          />
          {fieldErrors.full_name ? (
            <p id="full_name-error" className="mt-1.5 text-xs text-red-300">
              {fieldErrors.full_name}
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px]">Email *</span>
          <input
            type="email"
            className={`${field} mt-2`}
            value={form.email}
            onChange={set('email')}
            placeholder="you@company.com"
            {...fieldProps('email')}
          />
          {fieldErrors.email ? (
            <p id="email-error" className="mt-1.5 text-xs text-red-300">
              {fieldErrors.email}
            </p>
          ) : null}
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px]">Phone</span>
          <input type="tel" className={`${field} mt-2`} value={form.phone} onChange={set('phone')} placeholder="+91" />
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px]">Company</span>
          <input className={`${field} mt-2`} value={form.company} onChange={set('company')} placeholder="Company name" />
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px]">Service</span>
          <select className={`${field} mt-2`} value={form.service_interest} onChange={set('service_interest')}>
            <option value="">Select a service</option>
            {(services.data ?? []).map((s) => (
              <option key={s.slug} value={s.title}>{s.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow !text-[10px]">Budget</span>
          <select className={`${field} mt-2`} value={form.budget_range} onChange={set('budget_range')}>
            <option value="">Select a range</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="eyebrow !text-[10px]">Project details *</span>
        <textarea
          required
          rows={5}
          className={`${field} mt-2 resize-y`}
          value={form.message}
          onChange={set('message')}
          placeholder="What are you building, who is it for, and when do you need it?"
        />
      </label>

      <button
        type="submit"
        disabled={busy}
        className="text-[color:var(--ink)] inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--lime)] px-7 py-3.5 text-sm font-semibold transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        {busy ? 'Sending…' : cta}
      </button>
    </form>
  )
}
