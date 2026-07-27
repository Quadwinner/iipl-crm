import { createContext } from 'react'
import type { AuthResult, Role } from '@itoby/shared'

/** Derived from the shared auth contract so the app needs no direct supabase-js import. */
export type AuthSession = Extract<AuthResult, { kind: 'success' }>['session']

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthState {
  status: AuthStatus
  session: AuthSession | null
  role: Role | null
  email: string | null
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
