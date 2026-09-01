import { useCallback, useEffect, useMemo, useState } from 'react'
import { logout } from '@itoby/shared'
import type { Role } from '@itoby/shared'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { AuthContext, type AuthSession, type AuthStatus } from './auth-context'

interface InternalState {
  status: AuthStatus
  session: AuthSession | null
  role: Role | null
  failure: string | null
}

const INITIAL: InternalState = { status: 'loading', session: null, role: null, failure: null }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL)

  useEffect(() => {
    const client = supabase()
    let active = true

    async function resolve(session: AuthSession | null) {
      if (!session) {
        if (active) setState({ status: 'unauthenticated', session: null, role: null, failure: null })
        return
      }

      const { data, error } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!active) return

      /**
       * A session without a resolvable role is not a usable signed-in state: the
       * launcher would show nothing, and the rental module's role branch would
       * fall through to its no-access screen. Previously the error was discarded
       * and the user was left "authenticated" with role null, which reads as a
       * permissions problem rather than the transient failure it usually is.
       *
       * Ending the session is the honest outcome — signing in again re-runs this.
       */
      if (error || !data?.role) {
        void client.auth.signOut()
        setState({
          status: 'unauthenticated',
          session: null,
          role: null,
          failure: error
            ? 'We could not load your account. Sign in again.'
            : 'This account has no role assigned. Contact an administrator.',
        })
        return
      }

      setState({ status: 'authenticated', session, role: data.role, failure: null })
    }

    // A throw here would otherwise be an unhandled rejection and leave the app on
    // its loading state forever.
    client.auth
      .getSession()
      .then(({ data }) => resolve(data.session))
      .catch(() => {
        if (!active) return
        setState({
          status: 'unauthenticated',
          session: null,
          role: null,
          failure: 'We could not reach the sign-in service. Check your connection.',
        })
      })

    // Supabase advises against calling the client from inside this callback, so the
    // profile lookup is deferred to a fresh task.
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void resolve(session), 0)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    await logout(supabase())
    queryClient.clear()
    setState({ status: 'unauthenticated', session: null, role: null, failure: null })
  }, [])

  const value = useMemo(
    () => ({
      status: state.status,
      session: state.session,
      role: state.role,
      email: state.session?.user.email ?? null,
      failure: state.failure,
      signOut,
    }),
    [state, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
