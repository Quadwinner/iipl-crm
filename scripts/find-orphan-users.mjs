/**
 * Lists auth users that have no office_owners row and no staff role — i.e. orphans left
 * behind when create-owner's auth step succeeded but the owner RPC failed.
 * Pass --delete to remove them.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
const { data: owners } = await admin.from('office_owners').select('user_id')
const { data: profiles } = await admin.from('profiles').select('user_id, role')

const ownerIds = new Set((owners ?? []).map((o) => o.user_id))
const roleOf = new Map((profiles ?? []).map((p) => [p.user_id, p.role]))

const orphans = (users?.users ?? []).filter(
  (u) => !ownerIds.has(u.id) && roleOf.get(u.id) !== 'ADMINISTRATOR' && roleOf.get(u.id) !== 'MAINTENANCE_STAFF',
)

if (orphans.length === 0) {
  console.log('no orphaned auth users')
  process.exit(0)
}

console.log(`orphaned auth users (${orphans.length}):`)
for (const u of orphans) {
  console.log(`  ${u.email}  role=${roleOf.get(u.id) ?? 'none'}  id=${u.id}`)
}

if (process.argv.includes('--delete')) {
  for (const u of orphans) {
    const { error } = await admin.auth.admin.deleteUser(u.id)
    console.log(error ? `  FAILED ${u.email}: ${error.message}` : `  deleted ${u.email}`)
  }
}
