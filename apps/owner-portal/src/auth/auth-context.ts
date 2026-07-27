import { createContext } from 'react'

export const NOT_AN_OWNER_ERROR =
  'This portal is for office owners only. Sign in to the staff portal instead.'
export const OWNER_INACTIVE_ERROR =
  'This owner account is not active. Contact the IIPL office for assistance.'

export interface OwnerIdentity {
  userId: string
  ownerId: string
  name: string
  email: string
}

export type SignInOutcome = { ok: true } | { ok: false; message: string }

export interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  owner: OwnerIdentity | null
  signIn: (credentials: { email: string; password: string }) => Promise<SignInOutcome>
  signOut: () => Promise<void>
  /** Re-resolves the owner identity server-side, e.g. after a self-service profile edit. */
  refreshOwner: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
