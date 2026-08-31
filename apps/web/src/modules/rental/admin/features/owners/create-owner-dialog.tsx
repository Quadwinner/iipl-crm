import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ownerCreateSchema,
  OWNER_PASSWORD_MIN,
  OWNER_PHONE_MAX_DIGITS,
  OWNER_PHONE_MIN_DIGITS,
  type OwnerCreateInput,
} from '@itoby/shared'
import { Button } from '@rental-admin/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@rental-admin/components/ui/dialog'
import { Input } from '@rental-admin/components/ui/input'
import { Label } from '@rental-admin/components/ui/label'
import { EdgeFunctionError } from '@rental-admin/lib/edge-function'
import { useCreateOwner } from './api'

export function CreateOwnerDialog() {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createOwner = useCreateOwner()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OwnerCreateInput>({
    resolver: zodResolver(ownerCreateSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setFormError(null)
    }
  }

  async function onSubmit(values: OwnerCreateInput) {
    setFormError(null)
    try {
      await createOwner.mutateAsync(values)
      toast.success('Owner account created. Login instructions sent to the contact email.')
      onOpenChange(false)
    } catch (error) {
      const status = error instanceof EdgeFunctionError ? error.status : 0
      const message = error instanceof Error ? error.message : String(error)
      const lowered = message.toLowerCase()

      if (status === 409 || lowered.includes('email already exists')) {
        setError('email', { message: 'An account with this email already exists.' })
        return
      }
      if (status === 400) {
        if (lowered.includes('email')) setError('email', { message })
        else if (lowered.includes('phone')) setError('phone', { message })
        else if (lowered.includes('password')) setError('password', { message })
        else if (lowered.includes('name')) setError('name', { message })
        else setFormError(message)
        return
      }
      if (status === 401 || status === 403) {
        setFormError('Your role is not permitted to create owner accounts.')
        return
      }
      setFormError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          New owner
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New owner account</DialogTitle>
          <DialogDescription>
            The owner receives login instructions at the contact email.
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="owner-name">Name</Label>
            <Input
              id="owner-name"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'owner-name-error' : undefined}
              {...register('name')}
            />
            {errors.name ? (
              <p id="owner-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-email">Contact email</Label>
            <Input
              id="owner-email"
              type="email"
              autoComplete="off"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'owner-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="owner-email-error" role="alert" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-phone">Phone</Label>
            <Input
              id="owner-phone"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={
                errors.phone ? 'owner-phone-error owner-phone-hint' : 'owner-phone-hint'
              }
              {...register('phone')}
            />
            <p id="owner-phone-hint" className="text-muted-foreground text-sm">
              {OWNER_PHONE_MIN_DIGITS}–{OWNER_PHONE_MAX_DIGITS} digits, no spaces.
            </p>
            {errors.phone ? (
              <p id="owner-phone-error" role="alert" className="text-destructive text-sm">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-password">Temporary password</Label>
            <Input
              id="owner-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? 'owner-password-error owner-password-hint' : 'owner-password-hint'
              }
              {...register('password')}
            />
            <p id="owner-password-hint" className="text-muted-foreground text-sm">
              At least {OWNER_PASSWORD_MIN} characters.
            </p>
            {errors.password ? (
              <p id="owner-password-error" role="alert" className="text-destructive text-sm">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create owner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
