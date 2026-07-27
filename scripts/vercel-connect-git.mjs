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

const PROJECTS = [
  {
    name: 'iipl-admin-portal',
    // Exit 0 = skip build. Build only when the app or shared code changed.
    ignoreCommand:
      'git diff --quiet HEAD^ HEAD -- ../../apps/admin-portal ../../packages/shared ../../pnpm-lock.yaml',
  },
  {
    name: 'iipl-owner-portal',
    ignoreCommand:
      'git diff --quiet HEAD^ HEAD -- ../../apps/owner-portal ../../packages/shared ../../pnpm-lock.yaml',
  },
]

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

for (const { name, ignoreCommand } of PROJECTS) {
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
    body: JSON.stringify({ commandForIgnoringBuildStep: ignoreCommand }),
  })
  console.log(`${name}: ignored build step set`)
}
