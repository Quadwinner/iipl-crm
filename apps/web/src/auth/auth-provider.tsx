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
}

const INITIAL: InternalState = { status: 'loading', session: null, role: null }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL)

  useEffect(() => {
    const client = supabase()
    let active = true

    async function resolve(session: AuthSession | null) {
      if (!session) {
        if (active) setState({ status: 'unauthenticated', session: null, role: null })
        return
      }
      const { data } = await client
        .from('profiles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (!active) return
      setState({ status: 'authenticated', session, role: data?.role ?? null })
    }

    void client.auth.getSession().then(({ data }) => resolve(data.session))

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
    setState({ status: 'unauthenticated', session: null, role: null })
  }, [])

  const value = useMemo(
    () => ({
      status: state.status,
      session: state.session,
      role: state.role,
      email: state.session?.user.email ?? null,
      signOut,
    }),
    [state, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
