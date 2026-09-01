import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { paymentGracePeriodSchema, type PaymentGracePeriodInput } from '@itoby/shared'
import { Button } from '@itoby/ui'
import { mapDbError } from '@/lib/db-error'
import { useConfigurePaymentGracePeriod, type GlobalConfigRow } from './api'
import { NumberField, SettingsSection } from './fields'

export function PaymentGracePeriodForm({ config }: { config: GlobalConfigRow }) {
  const [formError, setFormError] = useState<string | null>(null)
  const configureGracePeriod = useConfigurePaymentGracePeriod()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentGracePeriodInput>({
    resolver: zodResolver(paymentGracePeriodSchema),
    defaultValues: { payment_grace_period_days: config.payment_grace_period_days },
  })

  useEffect(() => {
    setFormError(null)
    reset({ payment_grace_period_days: config.payment_grace_period_days })
  }, [config, reset])

  async function onSubmit(values: PaymentGracePeriodInput) {
    setFormError(null)
    try {
      await configureGracePeriod.mutateAsync(values)
      toast.success('Payment grace period saved')
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <SettingsSection
      title="Payment grace period"
      description="Days added to the billing cycle date to set an invoice due date."
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}

        <NumberField
          id="grace-period"
          label="Grace period"
          unit="days after the cycle date"
          min={0}
          error={errors.payment_grace_period_days?.message}
          registration={register('payment_grace_period_days', { valueAsNumber: true })}
        />

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save grace period'}
        </Button>
      </form>
    </SettingsSection>
  )
}
