import { useEffect } from 'react'

interface SEOHeadProps {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  image?: string
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

const SITE_URL = 'https://www.itobyinfotech.com'
const DEFAULT_IMAGE = 'https://www.itobyinfotech.com/images/logo.png'

function upsertMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  el.content = content
}

/**
 * Same API as the source repo's react-helmet-async version, implemented against
 * the DOM directly so the app needs no extra dependency. This is a client-
 * rendered SPA, so these tags are for the browser and for crawlers that execute
 * JavaScript — not for static social-preview scraping.
 */
export function SEOHead({
  title,
  description,
  path,
  type = 'website',
  image = DEFAULT_IMAGE,
  jsonLd,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    const url = `${SITE_URL}${path}`
    document.title = title

    upsertMeta('meta[name="description"]', 'name', 'description', description)
    upsertMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', title)
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', description)
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type)
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', url)
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', image)
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = url

    if (!jsonLd) return
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify(jsonLd)
    document.head.append(script)
    return () => script.remove()
  }, [title, description, path, type, image, jsonLd, noindex])

  return null
}
