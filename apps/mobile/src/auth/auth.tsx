import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authenticate, logout } from '@itoby/shared/auth'
import type { Role } from '@itoby/shared/types'
import { supabase } from '../lib/supabase'

type Status = 'loading' | 'authenticated' | 'unauthenticated' | 'broken'

interface AuthValue {
  status: Status
  role: Role | null
  email: string | null
  /** Set only when status is 'broken' — a startup failure worth showing verbatim. */
  failure: Error | null
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

/** Rejects rather than hanging, so a stalled network cannot strand the UI. */
async function withTimeout<T>(work: PromiseLike<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

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
  const [failure, setFailure] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    async function restore() {
      console.log('[itoby] restore: building client')
      const client = supabase()

      // A hung getSession() is indistinguishable from a slow one on screen, and
      // the app would sit on its spinner forever. Time it out and treat it as
      // "not signed in" — the sign-in screen can still recover from there.
      console.log('[itoby] restore: reading stored session')
      const { data } = await withTimeout(
        client.auth.getSession(),
        8000,
        'Reading the stored session timed out.',
      )
      if (!active) return
      console.log('[itoby] restore: session?', Boolean(data.session))
      if (!data.session) {
        setStatus('unauthenticated')
        return
      }
      const { data: profile } = await withTimeout(
        client
          .from('profiles')
          .select('role')
          .eq('user_id', data.session.user.id)
          .maybeSingle(),
        8000,
        'Loading your profile timed out. Check your connection.',
      )
      if (!active) return
      setRole(profile?.role ?? null)
      setEmail(data.session.user.email ?? null)
      setStatus('authenticated')
    }

    // A throw in here would otherwise become an unhandled rejection, which no
    // error boundary catches — the app would just show a blank screen.
    restore().catch((error: unknown) => {
      console.error('[itoby] restore failed:', error)
      if (!active) return
      setFailure(error instanceof Error ? error : new Error(String(error)))
      setStatus('broken')
    })

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback<AuthValue['signIn']>(async (nextEmail, password) => {
    let result
    try {
      result = await authenticate(supabase(), { email: nextEmail, password })
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
    if (result.kind !== 'success') return { ok: false, message: result.message }
    setRole(result.role)
    setEmail(result.session.user.email ?? null)
    setStatus('authenticated')
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout(supabase())
    } catch {
      // Clearing local state matters more than a clean server-side sign-out.
    }
    setRole(null)
    setEmail(null)
    setStatus('unauthenticated')
  }, [])

  const value = useMemo(
    () => ({ status, role, email, failure, signIn, signOut }),
    [status, role, email, failure, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
