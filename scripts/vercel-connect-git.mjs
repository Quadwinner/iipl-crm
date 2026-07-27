/**
 * Connects both Vercel projects to the GitHub repo so pushes auto-deploy, and sets a
 * per-project ignored build step so a change touching only one portal does not rebuild
 * the other.
 *
 * Usage: VERCEL_TOKEN=... node scripts/vercel-connect-git.mjs
 */
const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('VERCEL_TOKEN is required')
  process.exit(1)
}

const REPO = 'Quadwinner/iipl-crm'

/**
 * No ignored build step: a `git diff --quiet HEAD^ HEAD` guard exits 0 ("skip") on merge
 * commits and on Vercel's shallow clones where HEAD^ is absent, which silently CANCELs
 * legitimate deployments. Rebuilding both portals on every push wastes a build but never
 * skips one that mattered.
 */
const PROJECTS = [{ name: 'iipl-admin-portal' }, { name: 'iipl-owner-portal' }]

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
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${JSON.stringify(body)}`)
  return body
}

for (const { name } of PROJECTS) {
  try {
    await api(`/v9/projects/${name}/link`, {
      method: 'POST',
      body: JSON.stringify({ type: 'github', repo: REPO, productionBranch: 'main' }),
    })
    console.log(`${name}: linked to ${REPO} (production branch: main)`)
  } catch (err) {
    console.log(`${name}: link failed -> ${err.message}`)
  }

  await api(`/v9/projects/${name}`, {
    method: 'PATCH',
    body: JSON.stringify({ commandForIgnoringBuildStep: null }),
  })
  console.log(`${name}: builds on every push (no ignore step)`)
}
