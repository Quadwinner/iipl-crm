import { Separator } from '@rental-admin/components/ui/separator'
import { Skeleton } from '@rental-admin/components/ui/skeleton'
import { useGlobalConfig } from '@rental-admin/features/settings/api'
import { CompanyBillingForm } from '@rental-admin/features/settings/company-billing-form'
import { FileTypeSection } from '@rental-admin/features/settings/file-type-section'
import { PaymentGracePeriodForm } from '@rental-admin/features/settings/payment-grace-period-form'
import { ReminderSettingsForm } from '@rental-admin/features/settings/reminder-settings-form'
import { SecurityPolicyForm } from '@rental-admin/features/settings/security-policy-form'

export function SettingsPage() {
  const config = useGlobalConfig()

  return (
    <section className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          System-wide configuration. Changes apply to every user immediately.
        </p>
      </div>

      <Separator />

      {config.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : config.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {config.error.message}
        </p>
      ) : (
        <>
          <SecurityPolicyForm config={config.data} />
          <Separator />
          <ReminderSettingsForm config={config.data} />
          <Separator />
          <PaymentGracePeriodForm config={config.data} />
          <Separator />
          <CompanyBillingForm config={config.data} />
        </>
      )}

      <Separator />

      <FileTypeSection />
    </section>
  )
}
