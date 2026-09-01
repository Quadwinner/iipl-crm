import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedRoute } from '@/auth/protected-route'
import { HomePage } from '@/routes/home-page'
import { LoginPage } from '@/routes/login-page'

/**
 * Everything behind sign-in is split out.
 *
 * The whole app was one 1.9 MB chunk, so a visitor reading the marketing site
 * downloaded the entire rental CRM and the content editor before the home page
 * could paint — code that most visitors never run. The public routes stay eager
 * because they are the first paint; the rest arrives when a route asks for it.
 */
const RentalModule = lazy(() =>
  import('@/modules/rental').then((m) => ({ default: m.RentalModule })),
)
const AdminShell = lazy(() =>
  import('@/routes/admin/admin-shell').then((m) => ({ default: m.AdminShell })),
)
const ContentPage = lazy(() =>
  import('@/routes/admin/content-page').then((m) => ({ default: m.ContentPage })),
)
const LeadsPage = lazy(() =>
  import('@/routes/admin/leads-page').then((m) => ({ default: m.LeadsPage })),
)
const LauncherPage = lazy(() =>
  import('@/routes/launcher-page').then((m) => ({ default: m.LauncherPage })),
)
const ModuleComingSoonPage = lazy(() =>
  import('@/routes/module-coming-soon').then((m) => ({ default: m.ModuleComingSoonPage })),
)

// The marketing pages share one chunk: a visitor on any of them is likely to
// open another, and splitting each would trade one download for several.
const sitePages = () => import('@/routes/site/pages')
const AboutPage = lazy(() => sitePages().then((m) => ({ default: m.AboutPage })))
const BlogPage = lazy(() => sitePages().then((m) => ({ default: m.BlogPage })))
const ContactPage = lazy(() => sitePages().then((m) => ({ default: m.ContactPage })))
const IndustriesPage = lazy(() => sitePages().then((m) => ({ default: m.IndustriesPage })))
const PortfolioPage = lazy(() => sitePages().then((m) => ({ default: m.PortfolioPage })))
const ProductsPage = lazy(() => sitePages().then((m) => ({ default: m.ProductsPage })))
const QuotePage = lazy(() => sitePages().then((m) => ({ default: m.QuotePage })))
const ServiceDetailPage = lazy(() => sitePages().then((m) => ({ default: m.ServiceDetailPage })))
const ServicesPage = lazy(() => sitePages().then((m) => ({ default: m.ServicesPage })))

/** Shown while a route chunk loads. Deliberately quiet — a spinner that flashes
 *  for 80ms is worse than a moment of nothing. */
function RouteFallback() {
  return <div className="min-h-svh" aria-busy="true" />
}

/**
 * Superapp route table.
 *
 *   /               product home — who this workspace is for, and sign in
 *   /login          one sign-in for all three roles
 *   /app            launcher — tiles from modules_for_current_user()
 *   /app/rental/*   the rental CRM, behind a splat so the tree uses relative paths
 *   /app/admin/*    leads inbox + content CMS, ADMINISTRATOR only
 *   /app/:key       registered-but-unbuilt modules, rendered from their own row
 *
 * Marketing — company, services, portfolio, blog — lives on itobyinfotech.com
 * and is deliberately NOT duplicated here.
 *
 * Auth sits at the product boundary, not the front door: the home page is
 * anonymous and /login is reached only when opening a product that needs an
 * account. ProtectedRoute records where the visitor was headed so they land
 * back on it after signing in.
 */
export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/services/:slug" element={<ServiceDetailPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/industries" element={<IndustriesPage />} />
      <Route path="/portfolio" element={<PortfolioPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/request-quote" element={<QuotePage />} />
      <Route path="/quote" element={<Navigate to="/request-quote" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<LauncherPage />} />
          <Route path="rental/*" element={<RentalModule />} />
          <Route path="admin" element={<AdminShell />}>
            <Route index element={<Navigate to="/app/admin/leads" replace />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="content" element={<ContentPage />} />
          </Route>
          <Route path=":moduleKey" element={<ModuleComingSoonPage />} />
        </Route>
      </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
