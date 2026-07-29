import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { reminderSettingsSchema, type ReminderSettingsInput } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import { mapDbError } from '@/lib/db-error'
import { useConfigureReminderSettings, type GlobalConfigRow } from './api'
import { NumberField, SettingsSection } from './fields'

export function ReminderSettingsForm({ config }: { config: GlobalConfigRow }) {
  const [formError, setFormError] = useState<string | null>(null)
  const configureReminders = useConfigureReminderSettings()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReminderSettingsInput>({
    resolver: zodResolver(reminderSettingsSchema),
    defaultValues: {
      reminder_lead_time_days: config.reminder_lead_time_days,
      reminder_frequency_days: config.reminder_frequency_days,
    },
  })

  useEffect(() => {
    setFormError(null)
    reset({
      reminder_lead_time_days: config.reminder_lead_time_days,
      reminder_frequency_days: config.reminder_frequency_days,
    })
  }, [config, reset])

  async function onSubmit(values: ReminderSettingsInput) {
    setFormError(null)
    try {
      await configureReminders.mutateAsync(values)
      toast.success('Reminder settings saved')
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <SettingsSection
      title="Payment reminders"
      description="How far before a due date automatic reminders start, and how often they repeat while an invoice is unpaid. Administrators can also share a bill reminder for any unpaid invoice from Billing in the Admin Portal (email, SMS, and in-app)."
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-6">
          <NumberField
            id="reminder-lead-time"
            label="Reminder lead time"
            unit="days before due date"
            min={1}
            error={errors.reminder_lead_time_days?.message}
            registration={register('reminder_lead_time_days', { valueAsNumber: true })}
          />
          <NumberField
            id="reminder-frequency"
            label="Reminder frequency"
            unit="days between reminders"
            min={1}
            error={errors.reminder_frequency_days?.message}
            registration={register('reminder_frequency_days', { valueAsNumber: true })}
          />
        </div>

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save reminder settings'}
        </Button>
      </form>
    </SettingsSection>
  )
}
