import { ScreenHeader } from '@/components/screen-header'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/use-auth'
import { useOwnerProfile } from '@/features/profile/api'
import { ProfileForm } from '@/features/profile/profile-form'
import { formatDate } from '@/lib/format'

export function ProfileScreen() {
  const { owner } = useAuth()
  const profile = useOwnerProfile(owner?.userId ?? '')

  return (
    <>
      <ScreenHeader title="Your profile" />

      {profile.isPending ? (
        <div className="max-w-md space-y-4" aria-busy="true">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : profile.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {profile.error.message}
        </p>
      ) : (
        <>
          <ProfileForm profile={profile.data} />

          <Separator className="my-8" />

          <h2 className="text-muted-foreground mb-3 text-xs font-medium uppercase">Account</h2>
          <dl className="grid max-w-md gap-x-6 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{profile.data.status === 'ACTIVE' ? 'Active' : 'Deactivated'}</dd>
            <dt className="text-muted-foreground">Owner since</dt>
            <dd>{formatDate(profile.data.created_at.slice(0, 10))}</dd>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd>{formatDate(profile.data.updated_at.slice(0, 10))}</dd>
          </dl>
        </>
      )}
    </>
  )
}
