/**
 * Seeds the reference and demo data the portals need before anything can be exercised
 * by hand: Buildings (no UI creates these), a known Administrator password, and one
 * active Office_Owner. Everything else is meant to be created through the portals.
 *
 * Usage: node scripts/seed-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const ADMIN_EMAIL = 'admin@iipl-crm.local'
const ADMIN_PASSWORD = 'Admin@12345'
const OWNER_EMAIL = 'owner@iipl-crm.local'
const OWNER_PASSWORD = 'Owner@12345'
const OWNER_NAME = 'Acme Consulting Pvt Ltd'
const OWNER_PHONE = '9876543210'

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function findUser(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  return data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null
}

// 1. Administrator with a known password.
const existingAdmin = await findUser(ADMIN_EMAIL)
let adminId
if (existingAdmin) {
  adminId = existingAdmin.id
  const { error } = await admin.auth.admin.updateUserById(adminId, { password: ADMIN_PASSWORD })
  if (error) throw new Error(`admin password reset failed: ${error.message}`)
  console.log(`reset password for ${ADMIN_EMAIL}`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`admin create failed: ${error.message}`)
  adminId = data.user.id
  console.log(`created ${ADMIN_EMAIL}`)
}
await admin.from('profiles').upsert({ user_id: adminId, role: 'ADMINISTRATOR' }, { onConflict: 'user_id' })

// A lockout from earlier failed attempts would block sign-in.
await admin
  .from('profiles')
  .update({ failed_login_count: 0, locked_until: null })
  .eq('user_id', adminId)

// 2. Buildings — reference data with no create screen in either portal.
const BUILDINGS = [
  { name: 'Tower A', address: '12 MG Road, Jaipur' },
  { name: 'Tower B', address: '48 Civil Lines, Jaipur' },
]
for (const b of BUILDINGS) {
  const { data: found } = await admin.from('building').select('id').eq('name', b.name).maybeSingle()
  if (found) {
    console.log(`building ${b.name} already exists`)
    continue
  }
  const { error } = await admin.from('building').insert(b)
  if (error) throw new Error(`building ${b.name} failed: ${error.message}`)
  console.log(`created building ${b.name}`)
}

// 3. One active Office_Owner so the owner portal is reachable.
const existingOwnerUser = await findUser(OWNER_EMAIL)
let ownerUserId
if (existingOwnerUser) {
  ownerUserId = existingOwnerUser.id
  const { error } = await admin.auth.admin.updateUserById(ownerUserId, { password: OWNER_PASSWORD })
  if (error) throw new Error(`owner password reset failed: ${error.message}`)
  console.log(`reset password for ${OWNER_EMAIL}`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`owner create failed: ${error.message}`)
  ownerUserId = data.user.id
  console.log(`created ${OWNER_EMAIL}`)
}
await admin
  .from('profiles')
  .upsert({ user_id: ownerUserId, role: 'OFFICE_OWNER' }, { onConflict: 'user_id' })
await admin
  .from('profiles')
  .update({ failed_login_count: 0, locked_until: null })
  .eq('user_id', ownerUserId)

const { data: ownerRow } = await admin
  .from('office_owners')
  .select('id')
  .eq('user_id', ownerUserId)
  .maybeSingle()

if (ownerRow) {
  await admin.from('office_owners').update({ status: 'ACTIVE' }).eq('id', ownerRow.id)
  console.log('office_owners row already exists (status set ACTIVE)')
} else {
  const { error } = await admin.from('office_owners').insert({
    user_id: ownerUserId,
    name: OWNER_NAME,
    contact_email: OWNER_EMAIL,
    phone: OWNER_PHONE,
    status: 'ACTIVE',
  })
  if (error) throw new Error(`office_owners insert failed: ${error.message}`)
  console.log(`created office_owner "${OWNER_NAME}"`)
}

console.log('\n--- sign in with ---')
console.log(`admin portal :5173   ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
console.log(`owner portal :5174   ${OWNER_EMAIL} / ${OWNER_PASSWORD}`)
