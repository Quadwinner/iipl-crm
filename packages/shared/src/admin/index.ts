/**
 * Staff-facing data access, shared by the admin portal, the web superapp's
 * rental module, and the Expo app.
 *
 * Same split as `../owner` and `../site`: the query takes a Supabase client, the
 * React Query wrapper stays in the app. Authorization is never decided here —
 * every one of these calls is gated by RLS and, for the RPCs, by
 * `require_permission()` inside the function.
 */
export * from './complaint'
export * from './inventory'
export * from './people'
