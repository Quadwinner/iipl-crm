/**
 * Creates (or updates) the two Vercel projects with the settings a pnpm workspace needs:
 * rootDirectory pointed at the app, but the whole repo uploaded so pnpm-lock.yaml and
 * packages/shared resolve. Without rootDirectory as a project setting, deploying from the
 * app folder uploads only that folder and npm fails on "workspace:*".
 *
 * Usage: VERCEL_TOKEN=... node scripts/vercel-setup.mjs
 */
const token = process.env.VERCEL_TOKEN
if (!token) {
  console.error('VERCEL_TOKEN is required')
  process.exit(1)
}

const API = 'https://api.vercel.com'

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
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
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} -> ${res.status} ${JSON.stringify(body)}`)
  }
  return body
}

const PROJECTS = [
  { name: 'iipl-admin-portal', rootDirectory: 'apps/admin-portal' },
  { name: 'iipl-owner-portal', rootDirectory: 'apps/owner-portal' },
]

const settings = (rootDirectory) => ({
  framework: 'vite',
  rootDirectory,
  // Install at the workspace root so `workspace:*` resolves and the pnpm lockfile is used.
  installCommand: 'cd ../.. && pnpm install --frozen-lockfile',
  buildCommand: 'pnpm build',
  outputDirectory: 'dist',
})

for (const { name, rootDirectory } of PROJECTS) {
  let project
  try {
    project = await api(`/v9/projects/${name}`)
    console.log(`${name}: exists`)
  } catch {
    project = await api('/v11/projects', {
      method: 'POST',
      body: JSON.stringify({ name, ...settings(rootDirectory) }),
    })
    console.log(`${name}: created`)
  }

  await api(`/v9/projects/${name}`, {
    method: 'PATCH',
    body: JSON.stringify(settings(rootDirectory)),
  })
  console.log(`  rootDirectory=${rootDirectory} installCommand=workspace-root framework=vite`)
  console.log(`  id=${project.id}`)
}
