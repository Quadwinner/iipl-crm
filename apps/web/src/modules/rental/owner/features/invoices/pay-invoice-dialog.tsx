import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  PAYMENT_AMOUNT_MIN,
  PAYMENT_GATEWAYS,
  paymentInitiationSchema,
  type GatewayType,
  type PaymentInitiationInput,
} from '@itoby/shared'

import { Button } from '@rental-owner/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@rental-owner/components/ui/dialog'
import { Input } from '@rental-owner/components/ui/input'
import { Label } from '@rental-owner/components/ui/label'
import { useAuth } from '@rental-owner/auth/use-auth'
import { EdgeFunctionError } from '@rental-owner/lib/edge-function'
import { formatCurrency, formatDate } from '@rental-owner/lib/format'
import { useCreatePaymentIntent, useRefreshAfterPayment, type InvoiceRow } from './api'
import { openRazorpayCheckout } from './razorpay'

const GATEWAY_LABELS: Record<GatewayType, string> = {
  UPI: 'UPI',
  RAZORPAY: 'Razorpay',
}

interface PayInvoiceDialogProps {
  invoice: InvoiceRow | null
  onClose: () => void
  /** Called once a gateway flow has been handed off, so the list can show the notice. */
  onAwaitingConfirmation: () => void
}

export function PayInvoiceDialog({
  invoice,
  onClose,
  onAwaitingConfirmation,
}: PayInvoiceDialogProps) {
  return (
    <Dialog open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {invoice ? (
          <PayInvoiceForm
            invoice={invoice}
            onClose={onClose}
            onAwaitingConfirmation={onAwaitingConfirmation}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function PayInvoiceForm({
  invoice,
  onClose,
  onAwaitingConfirmation,
}: {
  invoice: InvoiceRow
  onClose: () => void
  onAwaitingConfirmation: () => void
}) {
  const { owner } = useAuth()
  const createIntent = useCreatePaymentIntent()
  const refreshAfterPayment = useRefreshAfterPayment()

  const [formError, setFormError] = useState<string | null>(null)
  const [upiIntent, setUpiIntent] = useState<{ uri: string; reference: string } | null>(null)

  const payable = invoice.status !== 'PAID' && invoice.outstanding_amount >= PAYMENT_AMOUNT_MIN
  const schema = useMemo(
    () => paymentInitiationSchema(invoice.outstanding_amount),
    [invoice.outstanding_amount],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInitiationInput>({
    resolver: zodResolver(schema),
    defaultValues: { gateway: 'UPI', amount: invoice.outstanding_amount },
  })

  const gateway = watch('gateway')

  async function onSubmit(values: PaymentInitiationInput) {
    setFormError(null)

    try {
      const intent = await createIntent.mutateAsync({
        invoiceId: invoice.invoice_id,
        gateway: values.gateway,
        amount: values.amount,
      })

      if (values.gateway === 'RAZORPAY') {
        const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
        if (!keyId) {
          setFormError('Razorpay is not configured. Use UPI or contact the IIPL office.')
          return
        }

        const orderId = String(intent.gateway_data.orderId ?? intent.reference)
        const amountPaise = Number(intent.gateway_data.amountPaise ?? intent.amount * 100)

        await openRazorpayCheckout({
          keyId,
          orderId,
          amountPaise,
          description: `Invoice ${invoice.billing_cycle_key} · ${invoice.unit_code}`,
          ownerName: owner?.name ?? '',
          ownerEmail: owner?.email ?? '',
        })

        refreshAfterPayment()
        onAwaitingConfirmation()
        onClose()
        return
      }

      const uri = String(intent.gateway_data.upiUri ?? '')
      setUpiIntent({ uri, reference: intent.reference })
      refreshAfterPayment()
      onAwaitingConfirmation()
    } catch (cause) {
      applyError(cause)
    }
  }

  function applyError(cause: unknown) {
    if (cause instanceof EdgeFunctionError) {
      if (cause.code === 'INVOICE_ALREADY_PAID') {
        setFormError('This invoice is already paid. Nothing is outstanding.')
        return
      }
      if (cause.code === 'PERMISSION_DENIED') {
        setFormError('You are not permitted to pay this invoice.')
        return
      }
      if (cause.code === 'INVALID_REQUEST') {
        setError('amount', { type: 'server', message: cause.message })
        return
      }
    }
    setFormError(cause instanceof Error ? cause.message : String(cause))
  }

  if (upiIntent) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-base">Complete the UPI payment</DialogTitle>
          <DialogDescription>
            Open the request in your UPI app. We will update this invoice once the gateway confirms
            the payment, which can take a moment.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[7rem_1fr]">
          <dt className="text-muted-foreground">Reference</dt>
          <dd className="font-mono text-xs break-all">{upiIntent.reference}</dd>
        </dl>

        <DialogFooter className="gap-2 sm:justify-start">
          {upiIntent.uri ? (
            <Button asChild size="sm">
              <a href={upiIntent.uri} rel="noopener noreferrer">
                Open UPI app
              </a>
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base">Pay invoice {invoice.billing_cycle_key}</DialogTitle>
        <DialogDescription>
          {invoice.unit_code} · {invoice.building_name} · due {formatDate(invoice.due_date)}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[7rem_1fr]">
        <dt className="text-muted-foreground">Office rent</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(invoice.rent_amount)}</dd>
        <dt className="text-muted-foreground">Electricity</dt>
        <dd className="font-mono tabular-nums">
          {formatCurrency(invoice.electricity_amount ?? 0)}
          {invoice.electricity_units != null ? (
            <span className="text-muted-foreground ml-2 text-xs">
              ({invoice.electricity_units} units
              {invoice.electricity_units > 0 && (invoice.electricity_amount ?? 0) > 0
                ? ` × ₹${Math.round(((invoice.electricity_amount ?? 0) / invoice.electricity_units) * 100) / 100}`
                : ''}
              )
            </span>
          ) : null}
          {invoice.electricity_note ? (
            <span className="text-muted-foreground ml-2 text-xs">· {invoice.electricity_note}</span>
          ) : null}
        </dd>
        <dt className="text-muted-foreground">Maintenance</dt>
        <dd className="font-mono tabular-nums">
          {formatCurrency(invoice.maintenance_amount ?? 0)}
        </dd>
        <dt className="text-muted-foreground">Invoice total</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(invoice.total_amount)}</dd>
        <dt className="text-muted-foreground">Already paid</dt>
        <dd className="font-mono tabular-nums">{formatCurrency(invoice.paid_amount)}</dd>
        <dt className="text-muted-foreground">Outstanding</dt>
        <dd className="font-mono font-medium tabular-nums">
          {formatCurrency(invoice.outstanding_amount)}
        </dd>
      </dl>

      {payable ? (
        <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Payment method">
              {PAYMENT_GATEWAYS.map((value) => {
                const selected = gateway === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setValue('gateway', value, { shouldValidate: true })}
                    className={[
                      'focus-visible:ring-ring rounded-lg border px-3 py-3 text-left text-sm transition-colors outline-none focus-visible:ring-[3px]',
                      selected
                        ? 'border-foreground bg-muted/60 font-medium'
                        : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                    ].join(' ')}
                  >
                    <span className="block">{GATEWAY_LABELS[value]}</span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {value === 'UPI' ? 'Pay via UPI apps' : 'Card / UPI / netbanking'}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.gateway ? (
              <p role="alert" className="text-destructive text-sm">
                {errors.gateway.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  setValue('amount', invoice.outstanding_amount, { shouldValidate: true })
                }
              >
                Pay full amount
              </Button>
            </div>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min={PAYMENT_AMOUNT_MIN}
              max={invoice.outstanding_amount}
              inputMode="decimal"
              aria-invalid={errors.amount ? true : undefined}
              aria-describedby={errors.amount ? 'payment-amount-error' : 'payment-amount-hint'}
              {...register('amount', { valueAsNumber: true })}
            />
            <p id="payment-amount-hint" className="text-muted-foreground text-xs">
              Between {formatCurrency(PAYMENT_AMOUNT_MIN)} and{' '}
              {formatCurrency(invoice.outstanding_amount)}.
            </p>
            {errors.amount ? (
              <p id="payment-amount-error" role="alert" className="text-destructive text-sm">
                {errors.amount.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Starting…' : 'Continue to payment'}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <>
          <p role="alert" className="text-sm">
            {invoice.status === 'PAID'
              ? 'This invoice is already paid, so no payment can be started.'
              : 'This invoice has nothing outstanding.'}
          </p>
          <DialogFooter className="sm:justify-start">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </>
      )}
    </>
  )
}
