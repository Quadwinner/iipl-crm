import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authenticate, logout } from '@itoby/shared/auth'
import type { Role } from '@itoby/shared/types'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthValue {
  status: Status
  role: Role | null
  email: string | null
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}

/**
 * Sign-in goes through authenticate() from @itoby/shared — the same path the web
 * apps use — so lockout counting and the login audit row behave identically here.
 * The role comes back with the session, so only a restored session has to look it
 * up again.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [role, setRole] = useState<Role | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function restore() {
      const { data } = await supabase().auth.getSession()
      if (!active) return
      if (!data.session) {
        setStatus('unauthenticated')
        return
      }
      const { data: profile } = await supabase()
        .from('profiles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .maybeSingle()
      if (!active) return
      setRole(profile?.role ?? null)
      setEmail(data.session.user.email ?? null)
      setStatus('authenticated')
    }

    void restore()
    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback<AuthValue['signIn']>(async (nextEmail, password) => {
    const result = await authenticate(supabase(), { email: nextEmail, password })
    if (result.kind !== 'success') return { ok: false, message: result.message }
    setRole(result.role)
    setEmail(result.session.user.email ?? null)
    setStatus('authenticated')
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    await logout(supabase())
    setRole(null)
    setEmail(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, role, email, signIn, signOut }),
    [status, role, email, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
