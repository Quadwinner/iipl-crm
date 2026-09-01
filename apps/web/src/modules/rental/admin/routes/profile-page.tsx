import { Separator } from '@itoby/ui'
import { MyProfileForm } from '@rental-admin/features/profile/my-profile-form'

export function ProfilePage() {
  return (
    <section className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground text-sm">
          Your own account details. Only you and an administrator can change them.
        </p>
      </div>

      <Separator />

      <MyProfileForm />
    </section>
  )
}
