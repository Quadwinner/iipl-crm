import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2 } from 'lucide-react'

import { Button } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import { useAuth } from '@/auth/use-auth'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginScreen() {
  const { status, signIn } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const from = (location.state as { from?: string } | null)?.from

  if (status === 'authenticated') {
    return <Navigate to={from ?? '/home'} replace />
  }

  const onSubmit = async (values: LoginValues) => {
    setFormError(null)
    const result = await signIn(values)
    if (!result.ok) setFormError(result.message)
  }

  return (
    <main id="main" className="grid min-h-svh lg:grid-cols-2">
      <section className="bg-primary text-primary-foreground relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Building2 className="size-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">IIPL</p>
            <p className="text-sm text-white/80">Office Rentals</p>
          </div>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Your office, rent, and payments — in one place.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            View leases, pay invoices, download receipts, raise complaints, and manage your tenant
            profile securely.
          </p>
        </div>
        <p className="relative text-xs text-white/60">© IIPL Office Rentals</p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <div className="bg-primary text-primary-foreground mb-4 flex size-11 items-center justify-center rounded-xl">
              <Building2 className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Owner sign in</h1>
            <p className="text-muted-foreground mt-1 text-sm">IIPL office rentals · tenant accounts</p>
          </div>

          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground mt-1 text-sm">Sign in to your owner account</p>
          </div>

          <form
            className="surface-card space-y-4 p-5 sm:p-6"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                className="bg-background"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="email-error" className="text-destructive text-sm">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="bg-background"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <p id="password-error" className="text-destructive text-sm">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div aria-live="polite">
              {formError ? (
                <p role="alert" className="text-destructive text-sm">
                  {formError}
                </p>
              ) : null}
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
