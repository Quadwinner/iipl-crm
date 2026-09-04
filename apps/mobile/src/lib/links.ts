/**
 * Public pages the app links out to.
 *
 * The site origin is a build-time value rather than a constant here because the
 * company site is mid-migration: the superapp web build is replacing
 * itobyinfotech.com, and a preview deployment should point at itself rather
 * than at production. `EXPO_PUBLIC_SITE_ORIGIN` mirrors the web app's
 * `VITE_SITE_ORIGIN` so both read the same value from their own build.
 *
 * The fallback is the live domain, because a store build with no origin set
 * must still open a working privacy policy — Google Play requires one to be
 * reachable, and a dead link there fails review.
 */
const ORIGIN = (process.env.EXPO_PUBLIC_SITE_ORIGIN ?? '').replace(/\/+$/, '') || 'https://itobyinfotech.com'

export const links = {
  privacy: `${ORIGIN}/privacy`,
  terms: `${ORIGIN}/terms`,
} as const
