/**
 * Writes apps/web/public/sitemap.xml from the live content tables, so the
 * service and (later) blog/portfolio URLs stay true as content changes.
 *
 * Run it after adding content: node scripts/generate-sitemap.mjs
 * Deliberately NOT part of the build — a network call in the deploy path is a
 * new way for deploys to fail, and the committed file is fine until content moves.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'

for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
}

const ORIGIN = 'https://itobyinfotech.com'
const db = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

const STATIC = [
  ['/', '1.0'],
  ['/about', '0.8'],
  ['/services', '0.9'],
  ['/products', '0.9'],
  ['/industries', '0.8'],
  ['/portfolio', '0.7'],
  ['/blog', '0.7'],
  ['/contact', '0.8'],
  ['/request-quote', '0.8'],
]

const [{ data: services }, { data: posts }, { data: work }] = await Promise.all([
  db.from('service_offerings').select('slug').eq('is_published', true),
  db.from('blog_posts').select('slug').eq('is_published', true),
  db.from('portfolio_items').select('slug').eq('is_published', true),
])

const urls = [
  ...STATIC,
  ...(services ?? []).map((r) => [`/services/${r.slug}`, '0.7']),
  ...(posts ?? []).map((r) => [`/blog/${r.slug}`, '0.6']),
  ...(work ?? []).map((r) => [`/portfolio/${r.slug}`, '0.6']),
]

const today = new Date().toISOString().slice(0, 10)
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(([loc, pri]) => `  <url>\n    <loc>${ORIGIN}${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${pri}</priority>\n  </url>`)
  .join('\n')}
</urlset>
`
writeFileSync(new URL('../apps/web/public/sitemap.xml', import.meta.url), xml)
console.log(`sitemap.xml: ${urls.length} URLs (${services?.length ?? 0} services, ${posts?.length ?? 0} posts, ${work?.length ?? 0} work)`)
