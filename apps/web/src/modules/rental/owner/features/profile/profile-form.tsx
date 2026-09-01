import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ownerProfileUpdateSchema, type OwnerProfileUpdateInput } from '@itoby/shared'

import { Button } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import { useAuth } from '@rental-owner/auth/use-auth'
import { mapDbError } from '@rental-owner/lib/db-error'
import { useUpdateOwnerProfile, type OwnerProfile } from './api'

const EMAIL_CONFLICT = {
  field: 'contact_email',
  message: 'Another account already uses this email address.',
} as const

export function ProfileForm({ profile }: { profile: OwnerProfile }) {
  const { refreshOwner } = useAuth()
  const update = useUpdateOwnerProfile()
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OwnerProfileUpdateInput>({
    resolver: zodResolver(ownerProfileUpdateSchema),
    defaultValues: {
      name: profile.name,
      contact_email: profile.contact_email,
      phone: profile.phone,
    },
  })

  useEffect(() => {
    reset({
      name: profile.name,
      contact_email: profile.contact_email,
      phone: profile.phone,
    })
  }, [profile.name, profile.contact_email, profile.phone, reset])

  async function onSubmit(values: OwnerProfileUpdateInput) {
    setFormError(null)
    setSaved(false)
    try {
      const updated = await update.mutateAsync(values)
      reset({
        name: updated.name,
        contact_email: updated.contact_email,
        phone: updated.phone,
      })
      await refreshOwner()
      setSaved(true)
    } catch (cause) {
      const inline = mapDbError(cause, EMAIL_CONFLICT)
      if (inline.field === 'contact_email') {
        setError('contact_email', { type: 'server', message: inline.message })
      } else {
        setFormError(inline.message)
      }
    }
  }

  return (
    <form noValidate className="max-w-md space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Name</Label>
        <Input
          id="profile-name"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'profile-name-error' : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p id="profile-name-error" role="alert" className="text-destructive text-sm">
            {errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Contact email</Label>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.contact_email ? true : undefined}
          aria-describedby={errors.contact_email ? 'profile-email-error' : undefined}
          {...register('contact_email')}
        />
        {errors.contact_email ? (
          <p id="profile-email-error" role="alert" className="text-destructive text-sm">
            {errors.contact_email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-phone">Phone</Label>
        <Input
          id="profile-phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? 'profile-phone-error' : 'profile-phone-hint'}
          {...register('phone')}
        />
        <p id="profile-phone-hint" className="text-muted-foreground text-xs">
          10-15 digits, no spaces or symbols.
        </p>
        {errors.phone ? (
          <p id="profile-phone-error" role="alert" className="text-destructive text-sm">
            {errors.phone.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
        <p aria-live="polite" className="text-muted-foreground text-sm">
          {saved && !isDirty ? 'Profile updated.' : ''}
        </p>
      </div>
    </form>
  )
}
