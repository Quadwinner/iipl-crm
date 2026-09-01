import { useEffect } from 'react'

/**
 * The origin canonical URLs point at.
 *
 * Hardcoding itobyinfotech.com was wrong once this app became the company site:
 * every page told search engines the real version lived on a domain that is
 * being retired, which is a request to not index this one.
 *
 * `VITE_SITE_ORIGIN` lets a deployment declare where it actually lives. Falling
 * back to the browser's own origin is the safe default — a preview deployment
 * then claims itself rather than a domain it is not.
 */
export const SITE_ORIGIN =
  import.meta.env.VITE_SITE_ORIGIN?.trim() ||
  (typeof window === 'undefined' ? '' : window.location.origin)

interface Seo {
  title: string
  description: string
  /** Route path, e.g. `/services/web-design`. Used for the canonical URL. */
  path: string
  type?: 'website' | 'article'
  image?: string
  noindex?: boolean
}

function meta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.append(el)
  }
  el.content = content
}

/**
 * Per-page title, description, canonical and social tags.
 *
 * This is a client-rendered SPA, so these are set after mount — good for the
 * browser tab, browser history and crawlers that execute JavaScript, but not
 * for scrapers that only read the initial HTML. If link previews on social
 * platforms matter later, that needs prerendering, not more tags here.
 */
export function useSeo({ title, description, path, type = 'website', image, noindex }: Seo) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`
    document.title = title

    meta('meta[name="description"]', 'name', 'description', description)
    meta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex,nofollow' : 'index,follow')
    meta('meta[property="og:site_name"]', 'property', 'og:site_name', 'Itoby Infotech')
    meta('meta[property="og:title"]', 'property', 'og:title', title)
    meta('meta[property="og:description"]', 'property', 'og:description', description)
    meta('meta[property="og:type"]', 'property', 'og:type', type)
    meta('meta[property="og:url"]', 'property', 'og:url', url)
    meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    meta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    meta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    if (image) {
      meta('meta[property="og:image"]', 'property', 'og:image', image)
      meta('meta[name="twitter:image"]', 'name', 'twitter:image', image)
    }

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.append(link)
    }
    link.href = url
  }, [title, description, path, type, image, noindex])
}
