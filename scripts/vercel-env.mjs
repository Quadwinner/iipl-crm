/**
 * Pushes the browser-safe VITE_* variables from root .env into both Vercel projects.
 * Only VITE_-prefixed values are sent: the service-role key, Razorpay secret, webhook
 * secret, and Resend key stay in Supabase Function secrets and must never reach a bundle.
 *
 * Usage: VERCEL_TOKEN=... node scripts/vercel-env.mjs
 */
import { readFileSync } from 'node:fs'

const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('VERCEL_TOKEN is required')
  process.exit(1)
}

const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const SHARED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const PROJECTS = {
  'iipl-admin-portal': SHARED,
  'iipl-owner-portal': [...SHARED, 'VITE_RAZORPAY_KEY_ID'],
}

async function api(path, options = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const text = await res.text()
  const body = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${JSON.stringify(body)}`)
  return body
}

for (const [project, keys] of Object.entries(PROJECTS)) {
  const existing = await api(`/v9/projects/${project}/env?decrypt=false`)
  const byKey = new Map((existing.envs ?? []).map((e) => [e.key, e.id]))

  for (const key of keys) {
    const value = env[key]
    if (!value) {
      console.log(`${project}: ${key} MISSING in .env — skipped`)
      continue
    }
    if (byKey.has(key)) {
      await api(`/v9/projects/${project}/env/${byKey.get(key)}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, target: ['production', 'preview', 'development'] }),
      })
      console.log(`${project}: ${key} updated`)
    } else {
      await api(`/v10/projects/${project}/env`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          value,
          type: 'plain',
          target: ['production', 'preview', 'development'],
        }),
      })
      console.log(`${project}: ${key} added`)
    }
  }
}
