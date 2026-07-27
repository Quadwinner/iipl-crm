/** Invokes run_billing_cycle_job manually (pg_cron would normally drive it). */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const { data, error } = await admin.rpc('run_billing_cycle_job')
if (error) {
  console.error('run_billing_cycle_job failed:', error.code, error.message)
  process.exit(1)
}
console.log('run_billing_cycle_job ->', JSON.stringify(data))

const { data: invoices } = await admin
  .from('invoice')
  .select('id, billing_cycle_key, total_amount, due_date, status, office_unit(unit_code)')
  .order('due_date')

console.log(`\nINVOICES (${invoices?.length ?? 0}):`)
for (const i of invoices ?? []) {
  console.log(
    `  ${i.office_unit?.unit_code}  ${i.billing_cycle_key}  amount=${i.total_amount}  due=${i.due_date}  ${i.status}`,
  )
}
