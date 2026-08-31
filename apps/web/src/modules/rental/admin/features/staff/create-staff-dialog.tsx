import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  staffCreateSchema,
  OWNER_PASSWORD_MIN,
  OWNER_PHONE_MAX_DIGITS,
  OWNER_PHONE_MIN_DIGITS,
  type StaffCreateInput,
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
import { useCreateStaff } from './api'

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const createStaff = useCreateStaff()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  })

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setFormError(null)
    }
  }

  async function onSubmit(values: StaffCreateInput) {
    setFormError(null)
    try {
      await createStaff.mutateAsync(values)
      toast.success('Maintenance staff account created.')
      onOpenChange(false)
    } catch (error) {
      const status = error instanceof EdgeFunctionError ? error.status : 0
      const code = error instanceof EdgeFunctionError ? error.code : null
      const message = error instanceof Error ? error.message : String(error)
      const lowered = message.toLowerCase()

      if (status === 409 || code === 'EMAIL_EXISTS' || lowered.includes('already exists')) {
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
        setFormError('Your role is not permitted to create staff accounts.')
        return
      }
      setFormError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          New staff member
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New maintenance staff account</DialogTitle>
          <DialogDescription>
            The staff member signs in to the admin portal and can be assigned complaints.
          </DialogDescription>
        </DialogHeader>

        <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="staff-name">Name</Label>
            <Input
              id="staff-name"
              autoComplete="off"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? 'staff-name-error' : undefined}
              {...register('name')}
            />
            {errors.name ? (
              <p id="staff-name-error" role="alert" className="text-destructive text-sm">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              autoComplete="off"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? 'staff-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="staff-email-error" role="alert" className="text-destructive text-sm">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-phone">Phone</Label>
            <Input
              id="staff-phone"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={
                errors.phone ? 'staff-phone-error staff-phone-hint' : 'staff-phone-hint'
              }
              {...register('phone')}
            />
            <p id="staff-phone-hint" className="text-muted-foreground text-sm">
              {OWNER_PHONE_MIN_DIGITS}–{OWNER_PHONE_MAX_DIGITS} digits, no spaces.
            </p>
            {errors.phone ? (
              <p id="staff-phone-error" role="alert" className="text-destructive text-sm">
                {errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-password">Temporary password</Label>
            <Input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? 'staff-password-error staff-password-hint' : 'staff-password-hint'
              }
              {...register('password')}
            />
            <p id="staff-password-hint" className="text-muted-foreground text-sm">
              At least {OWNER_PASSWORD_MIN} characters.
            </p>
            {errors.password ? (
              <p id="staff-password-error" role="alert" className="text-destructive text-sm">
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
              {isSubmitting ? 'Creating…' : 'Create staff member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
