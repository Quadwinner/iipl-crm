import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authenticate } from '@itoby/shared'
import { Button } from '@itoby/ui'
import { Input } from '@itoby/ui'
import { Label } from '@itoby/ui'
import { useAuth } from '@/auth/use-auth'
import { useSiteSettings } from '@/features/site/use-site-settings'
import { supabase } from '@/lib/supabase'
import { homeRouteForRole } from '@/lib/navigation'

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type Credentials = z.infer<typeof credentialsSchema>

interface LoginLocationState {
  from?: string
  reason?: string
}

/**
 * One sign-in for all three roles. Authentication goes through authenticate()
 * from @itoby/shared so failed-attempt lockout counting and the login audit row
 * keep working exactly as they do in the standalone portals.
 */
export function LoginPage() {
  const { status, role } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const settings = useSiteSettings()
  const state = (location.state ?? null) as LoginLocationState | null
  const [signInError, setSignInError] = useState<string | null>(state?.reason ?? null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: '', password: '' },
  })

  if (status === 'authenticated' && role) {
    return <Navigate to={state?.from ?? homeRouteForRole(role)} replace />
  }

  async function onSubmit(values: Credentials) {
    setSignInError(null)
    const result = await authenticate(supabase(), values)

    if (result.kind !== 'success') {
      setSignInError(result.message)
      return
    }

    void navigate(state?.from ?? homeRouteForRole(result.role), { replace: true })
  }

  const companyName = settings.data?.company_name ?? ''

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
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-semibold backdrop-blur-sm">
            IT
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">{companyName}</p>
            <p className="text-sm text-white/80">{settings.data?.tagline ?? ''}</p>
          </div>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            One sign-in for every Itoby product.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-white/85">
            {settings.data?.intro ?? ''}
          </p>
        </div>
        <p className="relative text-xs text-white/60">
          {settings.data?.business_hours ? `Support ${settings.data.business_hours}` : ''}
        </p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Administrators, maintenance staff and office owners.
            </p>
          </div>

          <form
            noValidate
            className="surface-card space-y-5 p-5 sm:p-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {signInError ? (
              <p role="alert" className="text-destructive text-sm">
                {signInError}
              </p>
            ) : null}

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

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
