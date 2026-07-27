import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.argv[2] ?? process.env.SEED_ADMIN_EMAIL
const password = process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD
const fullName = process.argv[4] ?? process.env.SEED_ADMIN_NAME

if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}
if (!email || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password> [display name]')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

const { data: existing } = await admin.auth.admin.listUsers({ perPage: 1000 })
const found = existing?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())

let userId
if (found) {
  userId = found.id
  console.log(`User ${email} already exists, promoting to ADMINISTRATOR`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'ADMINISTRATOR' },
  })
  if (error) {
    console.error('Failed to create user:', error.message)
    process.exit(1)
  }
  userId = data.user.id
  console.log(`Created ${email}`)
}

// Without a name the audit trail and complaint history fall back to a bare role label.
const profile = { user_id: userId, role: 'ADMINISTRATOR' }
if (fullName) profile.full_name = fullName.trim()

const { error: roleError } = await admin
  .from('profiles')
  .upsert(profile, { onConflict: 'user_id' })

if (roleError) {
  console.error('Failed to set role:', roleError.message)
  process.exit(1)
}

console.log(`Done. ${email} is an ADMINISTRATOR.`)
