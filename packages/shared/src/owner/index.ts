/**
 * Owner-facing data access, shared by the web owner portal and the Expo app.
 *
 * Every function takes a Supabase client rather than importing one: the apps
 * build theirs differently (Vite env + browser storage vs Expo env +
 * AsyncStorage), and the query itself is identical either way.
 *
 * React Query hooks stay in the apps — they are thin wrappers, and their caching
 * and invalidation belong to the app. So does anything that touches a platform
 * API: opening a signed URL is `window.open` on web and a different call on
 * mobile, so this layer stops at returning the URL.
 */
export * from './complaint'
export * from './db-error'
export * from './document'
export * from './edge-function'
export * from './format'
export * from './invoice'
export * from './lease'
export * from './notification'
export * from './profile'
export * from './receipt'
