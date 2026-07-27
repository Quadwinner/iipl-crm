/**
 * One-time setup so the pg_cron job can invoke the notify Edge Function: stores the
 * project URL and service-role key in Vault via configure_notify_vault. Values are read
 * from the root .env, never committed.
 *
 * Usage: node scripts/configure-notify.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const { error } = await admin.rpc('configure_notify_vault', {
  p_project_url: url,
  p_service_role_key: serviceKey,
})

if (error) {
  console.error('configure_notify_vault failed:', error.code, error.message)
  process.exit(1)
}

console.log('Vault configured: project_url + service_role_key')

// Prove the cron path works by invoking it the same way pg_cron does.
const { error: invokeError } = await admin.rpc('invoke_notify')
if (invokeError) {
  console.error('invoke_notify failed:', invokeError.code, invokeError.message)
  process.exit(1)
}
console.log('invoke_notify dispatched (pg_net request queued)')
