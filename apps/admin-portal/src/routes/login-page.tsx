import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authenticate } from '@itoby/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WRONG_PORTAL_MESSAGE } from '@/auth/protected-route'
import { useAuth } from '@/auth/use-auth'
import { supabase } from '@/lib/supabase'
import { homeRouteForRole, isAdminPortalRole } from '@/lib/navigation'

const credentialsSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

type Credentials = z.infer<typeof credentialsSchema>

interface LoginLocationState {
  from?: string
  reason?: string
}

export function LoginPage() {
  const { status, role, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
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

  if (status === 'authenticated' && isAdminPortalRole(role)) {
    return <Navigate to={state?.from ?? homeRouteForRole(role)} replace />
  }

  async function onSubmit(values: Credentials) {
    setSignInError(null)
    const result = await authenticate(supabase(), values)

    if (result.kind !== 'success') {
      setSignInError(result.message)
      return
    }

    if (!isAdminPortalRole(result.role)) {
      await signOut()
      setSignInError(WRONG_PORTAL_MESSAGE)
      return
    }

    void navigate(state?.from ?? homeRouteForRole(result.role), { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">IIPL office rentals</h1>
        <p className="text-muted-foreground text-sm">Staff sign-in</p>
      </div>

      <form noValidate className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </main>
  )
}
