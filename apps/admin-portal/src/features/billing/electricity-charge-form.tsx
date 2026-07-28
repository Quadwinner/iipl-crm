import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mapDbError } from '@/lib/db-error'
import { formatCurrency } from '@/lib/format'
import { useSetElectricityCharge, type BillingRow } from './api'

/** Default tariff: ₹12 per unit (kWh). */
export const DEFAULT_ELECTRICITY_RATE = 12

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function inferRate(units: number | null | undefined, amount: number | null | undefined): number {
  if (units != null && units > 0 && amount != null && amount > 0) {
    return roundMoney(amount / units)
  }
  return DEFAULT_ELECTRICITY_RATE
}

const schema = z.object({
  units: z
    .number({ error: 'Enter units consumed.' })
    .min(0, 'Units cannot be negative.')
    .max(9_999_999.99, 'Units value is too large.'),
  rate: z
    .number({ error: 'Enter the rate per unit.' })
    .min(0, 'Rate cannot be negative.')
    .max(9_999.99, 'Rate is too large.'),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be at most 500 characters.')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface ElectricityChargeFormProps {
  invoice: BillingRow
  onSaved?: (updated: {
    electricity_amount: number
    electricity_units: number | null
    electricity_note: string | null
    total_amount: number
  }) => void
}

export function ElectricityChargeForm({ invoice, onSaved }: ElectricityChargeFormProps) {
  const setCharge = useSetElectricityCharge()
  const [formError, setFormError] = useState<string | null>(null)
  const locked = invoice.status === 'PAID'

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      units: invoice.electricity_units ?? 0,
      rate: inferRate(invoice.electricity_units, invoice.electricity_amount),
      note: invoice.electricity_note ?? '',
    },
  })

  const units = useWatch({ control, name: 'units' })
  const rate = useWatch({ control, name: 'rate' })
  const calculatedAmount =
    typeof units === 'number' &&
    typeof rate === 'number' &&
    !Number.isNaN(units) &&
    !Number.isNaN(rate)
      ? roundMoney(units * rate)
      : 0

  useEffect(() => {
    reset({
      units: invoice.electricity_units ?? 0,
      rate: inferRate(invoice.electricity_units, invoice.electricity_amount),
      note: invoice.electricity_note ?? '',
    })
    setFormError(null)
  }, [
    invoice.invoice_id,
    invoice.electricity_amount,
    invoice.electricity_units,
    invoice.electricity_note,
    reset,
  ])

  async function onSubmit(values: FormValues) {
    setFormError(null)
    const amount = roundMoney(values.units * values.rate)
    try {
      const updated = await setCharge.mutateAsync({
        invoiceId: invoice.invoice_id,
        amount,
        units: values.units,
        note: values.note?.trim() || undefined,
      })
      toast.success('Electricity charge saved — tenant can pay it with rent')
      onSaved?.({
        electricity_amount: updated.electricity_amount,
        electricity_units: updated.electricity_units,
        electricity_note: updated.electricity_note,
        total_amount: updated.total_amount,
      })
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <form className="space-y-3 rounded-lg border p-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Electricity bill</h3>
        <p className="text-muted-foreground text-xs">
          Enter units consumed — amount is calculated as units × rate (default ₹
          {DEFAULT_ELECTRICITY_RATE}/unit). Current rent {formatCurrency(invoice.rent_amount)}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`elec-units-${invoice.invoice_id}`}>Units consumed</Label>
          <Input
            id={`elec-units-${invoice.invoice_id}`}
            type="number"
            step="0.01"
            min={0}
            placeholder="e.g. 240"
            disabled={locked || isSubmitting}
            aria-invalid={!!errors.units}
            {...register('units', { valueAsNumber: true })}
          />
          {errors.units ? (
            <p role="alert" className="text-destructive text-sm">
              {errors.units.message}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">Meter units (kWh).</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`elec-rate-${invoice.invoice_id}`}>Rate per unit (₹)</Label>
          <Input
            id={`elec-rate-${invoice.invoice_id}`}
            type="number"
            step="0.01"
            min={0}
            disabled={locked || isSubmitting}
            aria-invalid={!!errors.rate}
            {...register('rate', { valueAsNumber: true })}
          />
          {errors.rate ? (
            <p role="alert" className="text-destructive text-sm">
              {errors.rate.message}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">Defaults to ₹{DEFAULT_ELECTRICITY_RATE}.</p>
          )}
        </div>
      </div>

      <div className="bg-muted/40 flex items-center justify-between gap-3 rounded-md px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">Calculated amount</p>
          <p className="text-muted-foreground text-xs">
            {typeof units === 'number' && !Number.isNaN(units) ? units : 0} units × ₹
            {typeof rate === 'number' && !Number.isNaN(rate) ? rate : 0}
          </p>
        </div>
        <p className="font-mono text-base font-semibold tabular-nums">
          {formatCurrency(calculatedAmount)}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`elec-note-${invoice.invoice_id}`}>Bill note (optional)</Label>
        <Input
          id={`elec-note-${invoice.invoice_id}`}
          placeholder="e.g. August 2026 meter reading"
          disabled={locked || isSubmitting}
          {...register('note')}
        />
        {errors.note ? (
          <p role="alert" className="text-destructive text-sm">
            {errors.note.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}

      {locked ? (
        <p className="text-muted-foreground text-xs">Paid invoices cannot be changed.</p>
      ) : (
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save electricity charge'}
        </Button>
      )}
    </form>
  )
}
