/**
 * Shows the latest deployments for both projects, including whether each was triggered by
 * a Git push or the CLI. Useful for confirming auto-deploy is wired up.
 *
 * Usage: VERCEL_TOKEN=... node scripts/vercel-status.mjs
 */
const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('VERCEL_TOKEN is required')
  process.exit(1)
}

const PROJECTS = ['iipl-admin-portal', 'iipl-owner-portal']

for (const name of PROJECTS) {
  const res = await fetch(
    `https://api.vercel.com/v6/deployments?app=${name}&limit=3`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  const body = await res.json()
  console.log(`\n=== ${name} ===`)
  for (const d of body.deployments ?? []) {
    const m = d.meta ?? {}
    const trigger = m.githubCommitSha ? `git ${String(m.githubCommitSha).slice(0, 7)}` : 'cli'
    const branch = m.githubCommitRef ?? '-'
    const when = new Date(d.created).toISOString().replace('T', ' ').slice(0, 19)
    console.log(`  ${d.state.padEnd(9)} ${trigger.padEnd(12)} branch=${branch.padEnd(6)} ${when}`)
    console.log(`    https://${d.url}`)
  }
}
