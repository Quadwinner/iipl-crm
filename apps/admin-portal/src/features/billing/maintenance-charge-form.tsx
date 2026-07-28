import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { mapDbError } from '@/lib/db-error'
import { useSetMaintenanceCharge, type BillingRow } from './api'

const schema = z.object({
  amount: z
    .number({ error: 'Enter the maintenance fee amount.' })
    .min(0, 'Amount cannot be negative.')
    .max(9_999_999.99, 'Amount is too large.'),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be at most 500 characters.')
    .optional()
    .or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

interface MaintenanceChargeFormProps {
  invoice: BillingRow
  onSaved?: (updated: {
    maintenance_amount: number
    maintenance_note: string | null
    total_amount: number
  }) => void
}

export function MaintenanceChargeForm({ invoice, onSaved }: MaintenanceChargeFormProps) {
  const setCharge = useSetMaintenanceCharge()
  const [formError, setFormError] = useState<string | null>(null)
  const locked = invoice.status === 'PAID'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: invoice.maintenance_amount ?? 0,
      note: invoice.maintenance_note ?? '',
    },
  })

  useEffect(() => {
    reset({
      amount: invoice.maintenance_amount ?? 0,
      note: invoice.maintenance_note ?? '',
    })
    setFormError(null)
  }, [invoice.invoice_id, invoice.maintenance_amount, invoice.maintenance_note, reset])

  async function onSubmit(values: FormValues) {
    setFormError(null)
    try {
      const updated = await setCharge.mutateAsync({
        invoiceId: invoice.invoice_id,
        amount: values.amount,
        note: values.note?.trim() || undefined,
      })
      toast.success('Maintenance fee saved — tenant can pay it with rent')
      onSaved?.({
        maintenance_amount: updated.maintenance_amount,
        maintenance_note: updated.maintenance_note,
        total_amount: updated.total_amount,
      })
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <form className="space-y-3 rounded-lg border p-3" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-1">
        <h3 className="text-sm font-medium">Maintenance fee</h3>
        <p className="text-muted-foreground text-xs">
          Common-area / building maintenance billed with rent and electricity for this cycle.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`maint-amount-${invoice.invoice_id}`}>Amount (₹)</Label>
        <Input
          id={`maint-amount-${invoice.invoice_id}`}
          type="number"
          step="0.01"
          min={0}
          disabled={locked || isSubmitting}
          aria-invalid={!!errors.amount}
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount ? (
          <p role="alert" className="text-destructive text-sm">
            {errors.amount.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`maint-note-${invoice.invoice_id}`}>Note (optional)</Label>
        <Input
          id={`maint-note-${invoice.invoice_id}`}
          placeholder="e.g. August 2026 common area upkeep"
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
          {isSubmitting ? 'Saving…' : 'Save maintenance fee'}
        </Button>
      )}
    </form>
  )
}
