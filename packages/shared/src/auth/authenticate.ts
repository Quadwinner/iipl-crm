import type { Session } from '@supabase/supabase-js'
import type { TypedSupabaseClient } from '../supabase/client'
import type { Role } from '../types/domain'

export const GENERIC_CREDENTIALS_ERROR = 'Invalid email or password.'
export const ACCOUNT_LOCKED_ERROR =
  'This account is temporarily locked due to too many failed sign-in attempts. Try again later.'

export type AuthResult =
  | { kind: 'success'; session: Session; role: Role }
  | { kind: 'invalid_credentials'; message: string }
  | { kind: 'account_locked'; message: string }

export interface Credentials {
  email: string
  password: string
}

export async function authenticate(
  client: TypedSupabaseClient,
  { email, password }: Credentials,
): Promise<AuthResult> {
  const { data: locked } = await client.rpc('is_account_locked', { p_email: email })
  if (locked) return { kind: 'account_locked', message: ACCOUNT_LOCKED_ERROR }

  const { data, error } = await client.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    await client.rpc('record_login_failure', { p_email: email })
    // Re-check: this attempt may have crossed the lockout threshold.
    const { data: nowLocked } = await client.rpc('is_account_locked', { p_email: email })
    return nowLocked
      ? { kind: 'account_locked', message: ACCOUNT_LOCKED_ERROR }
      : { kind: 'invalid_credentials', message: GENERIC_CREDENTIALS_ERROR }
  }

  await client.rpc('record_login_success')

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('user_id', data.session.user.id)
    .single()

  if (!profile) {
    await client.auth.signOut()
    return { kind: 'invalid_credentials', message: GENERIC_CREDENTIALS_ERROR }
  }

  return { kind: 'success', session: data.session, role: profile.role }
}

export async function logout(client: TypedSupabaseClient): Promise<void> {
  await client.auth.signOut()
}
