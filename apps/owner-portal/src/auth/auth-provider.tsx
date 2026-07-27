import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authenticate, logout } from '@itoby/shared'

import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import {
  AuthContext,
  NOT_AN_OWNER_ERROR,
  OWNER_INACTIVE_ERROR,
  type AuthContextValue,
  type OwnerIdentity,
  type SignInOutcome,
} from './auth-context'

type ResolveResult = { ok: true; owner: OwnerIdentity } | { ok: false; message: string }

/**
 * Resolves the signed-in user's owner identity. Any session that is not an active
 * OFFICE_OWNER is signed out here so a wrong-portal or deactivated account never
 * holds a session in this app (Requirements 4.7, 5.1).
 */
async function resolveOwner(userId: string): Promise<ResolveResult> {
  const client = supabase()

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (profile?.role !== 'OFFICE_OWNER') {
    await logout(client)
    return { ok: false, message: NOT_AN_OWNER_ERROR }
  }

  const { data: owner } = await client
    .from('office_owners')
    .select('id, name, contact_email, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (!owner || owner.status !== 'ACTIVE') {
    await logout(client)
    return { ok: false, message: OWNER_INACTIVE_ERROR }
  }

  return {
    ok: true,
    owner: { userId, ownerId: owner.id, name: owner.name, email: owner.contact_email },
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue['status']>('loading')
  const [owner, setOwner] = useState<OwnerIdentity | null>(null)

  const clear = useCallback(() => {
    setOwner(null)
    setStatus('unauthenticated')
    queryClient.clear()
  }, [])

  useEffect(() => {
    let active = true

    const restore = async () => {
      const {
        data: { session },
      } = await supabase().auth.getSession()

      if (!active) return
      if (!session) {
        setStatus('unauthenticated')
        return
      }

      const result = await resolveOwner(session.user.id)
      if (!active) return
      if (result.ok) {
        setOwner(result.owner)
        setStatus('authenticated')
      } else {
        clear()
      }
    }

    void restore()

    const {
      data: { subscription },
    } = supabase().auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && active) clear()
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [clear])

  const signIn = useCallback(
    async (credentials: { email: string; password: string }): Promise<SignInOutcome> => {
      const client = supabase()
      const result = await authenticate(client, credentials)

      if (result.kind !== 'success') {
        return { ok: false, message: result.message }
      }

      if (result.role !== 'OFFICE_OWNER') {
        await logout(client)
        return { ok: false, message: NOT_AN_OWNER_ERROR }
      }

      const resolved = await resolveOwner(result.session.user.id)
      if (!resolved.ok) return { ok: false, message: resolved.message }

      setOwner(resolved.owner)
      setStatus('authenticated')
      return { ok: true }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await logout(supabase())
    clear()
  }, [clear])

  const refreshOwner = useCallback(async () => {
    const {
      data: { session },
    } = await supabase().auth.getSession()
    if (!session) {
      clear()
      return
    }

    const result = await resolveOwner(session.user.id)
    if (result.ok) setOwner(result.owner)
    else clear()
  }, [clear])

  const value = useMemo<AuthContextValue>(
    () => ({ status, owner, signIn, signOut, refreshOwner }),
    [status, owner, signIn, signOut, refreshOwner],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
