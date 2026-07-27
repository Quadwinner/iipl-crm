import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { myProfileSchema, type MyProfileInput } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/auth/use-auth'
import { mapDbError } from '@/lib/db-error'
import { SettingsSection } from '@/features/settings/fields'
import { useMyProfile, useUpdateMyProfile } from './api'

export function MyProfileForm() {
  const { session, email } = useAuth()
  const userId = session?.user.id
  const profile = useMyProfile(userId)
  const updateProfile = useUpdateMyProfile()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MyProfileInput>({
    resolver: zodResolver(myProfileSchema),
    defaultValues: { full_name: '', phone: '' },
  })

  useEffect(() => {
    if (!profile.data) return
    setFormError(null)
    reset({ full_name: profile.data.full_name ?? '', phone: profile.data.phone ?? '' })
  }, [profile.data, reset])

  async function onSubmit(values: MyProfileInput) {
    setFormError(null)
    try {
      await updateProfile.mutateAsync(values)
      toast.success('Your profile was saved')
    } catch (error) {
      setFormError(mapDbError(error).message)
    }
  }

  return (
    <SettingsSection
      title="Your profile"
      description={
        email
          ? `Signed in as ${email}. Your name is what other users see on complaint assignments and status history.`
          : 'Your name is what other users see on complaint assignments and status history.'
      }
    >
      {profile.isPending ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full max-w-sm" />
        </div>
      ) : profile.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {profile.error.message}
        </p>
      ) : (
        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Display name</Label>
            <Input
              id="profile-name"
              className="max-w-sm"
              autoComplete="name"
              aria-invalid={errors.full_name ? true : undefined}
              aria-describedby={errors.full_name ? 'profile-name-error' : undefined}
              {...register('full_name')}
            />
            {errors.full_name ? (
              <p id="profile-name-error" role="alert" className="text-destructive text-sm">
                {errors.full_name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone (optional)</Label>
            <Input
              id="profile-phone"
              inputMode="numeric"
              className="max-w-xs"
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
              {...register('phone')}
            />
            {errors.phone ? (
              <p id="profile-phone-error" role="alert" className="text-destructive text-sm">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      )}
    </SettingsSection>
  )
}
