import type { ReactNode } from 'react'

import { CurrencyProvider } from '@/site/hooks/useCurrency'
import { Footer } from './Footer'
import { Header } from './Header'
import { BackToTop } from '@/site/ui/back-to-top'
import { ScrollProgress } from '@/site/ui/scroll-progress'
import { WhatsAppButton } from '@/site/ui/whatsapp-button'

/**
 * Wrapper for every public marketing page.
 *
 * `.itoby-site` scopes the ported dark/lime palette: the design tokens are
 * redefined on this element, so Tailwind utilities inside resolve to the site
 * theme while the signed-in CRM keeps its own. The optional overlays from the
 * source repo (AI chatbot, PWA banner, command palette, analytics) are left
 * out — they pull in Next-only and Sentry dependencies this app does not have.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <CurrencyProvider>
      <div className="itoby-site min-h-svh">
        <ScrollProgress />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsAppButton />
        <BackToTop />
      </div>
    </CurrencyProvider>
  )
}
