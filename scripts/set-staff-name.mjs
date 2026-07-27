/**
 * Sets profiles.full_name for Company_Staff accounts that have none. Accounts created
 * before the full_name column existed resolve to the neutral 'IIPL staff' label in
 * complaint history, which is the designed fallback but reads as a missing name.
 *
 * Usage: node scripts/set-staff-name.mjs                 # report only
 *        node scripts/set-staff-name.mjs <email> "<name>" # set one
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

const [email, name] = process.argv.slice(2)

const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
const { data: profiles } = await admin
  .from('profiles')
  .select('user_id, role, full_name')
  .in('role', ['ADMINISTRATOR', 'MAINTENANCE_STAFF'])

const emailOf = new Map((users?.users ?? []).map((u) => [u.id, u.email]))

if (!email) {
  console.log('COMPANY STAFF NAMES:')
  for (const p of profiles ?? []) {
    console.log(`  ${emailOf.get(p.user_id)}  role=${p.role}  full_name=${p.full_name ?? '(null)'}`)
  }
  process.exit(0)
}

if (!name) {
  console.error('Usage: node scripts/set-staff-name.mjs <email> "<name>"')
  process.exit(1)
}

const target = users?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (!target) {
  console.error(`no auth user for ${email}`)
  process.exit(1)
}

const { error } = await admin
  .from('profiles')
  .update({ full_name: name })
  .eq('user_id', target.id)

if (error) {
  console.error('update failed:', error.message)
  process.exit(1)
}
console.log(`${email}: full_name set to "${name}"`)
