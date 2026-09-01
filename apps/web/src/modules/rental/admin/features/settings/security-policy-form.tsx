import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { securityPolicySchema, type SecurityPolicyInput } from '@itoby/shared'
import { Button } from '@itoby/ui'
import { mapDbError } from '@rental-admin/lib/db-error'
import { useConfigureSecurityPolicy, type GlobalConfigRow } from './api'
import { NumberField, SettingsSection } from './fields'

export function SecurityPolicyForm({ config }: { config: GlobalConfigRow }) {
  const [formError, setFormError] = useState<string | null>(null)
  const configureSecurityPolicy = useConfigureSecurityPolicy()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SecurityPolicyInput>({
    resolver: zodResolver(securityPolicySchema),
    defaultValues: {
      session_timeout_minutes: config.session_timeout_minutes,
      lockout_threshold: config.lockout_threshold,
      lockout_duration_minutes: config.lockout_duration_minutes,
    },
  })

  useEffect(() => {
    setFormError(null)
    reset({
      session_timeout_minutes: config.session_timeout_minutes,
      lockout_threshold: config.lockout_threshold,
      lockout_duration_minutes: config.lockout_duration_minutes,
    })
  }, [config, reset])

  async function onSubmit(values: SecurityPolicyInput) {
    setFormError(null)
    try {
      await configureSecurityPolicy.mutateAsync(values)
      toast.success('Security policy saved')
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <SettingsSection
      title="Security policy"
      description="Idle session limit and account lockout after repeated failed sign-ins."
    >
      <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {formError ? (
          <p role="alert" className="text-destructive text-sm">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-6">
          <NumberField
            id="session-timeout"
            label="Session timeout"
            unit="minutes"
            min={1}
            error={errors.session_timeout_minutes?.message}
            registration={register('session_timeout_minutes', { valueAsNumber: true })}
          />
          <NumberField
            id="lockout-threshold"
            label="Lockout threshold"
            unit="failed attempts"
            min={1}
            error={errors.lockout_threshold?.message}
            registration={register('lockout_threshold', { valueAsNumber: true })}
          />
          <NumberField
            id="lockout-duration"
            label="Lockout duration"
            unit="minutes"
            min={1}
            error={errors.lockout_duration_minutes?.message}
            registration={register('lockout_duration_minutes', { valueAsNumber: true })}
          />
        </div>

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save security policy'}
        </Button>
      </form>
    </SettingsSection>
  )
}
