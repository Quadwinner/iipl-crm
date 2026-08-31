import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedRoute } from '@/auth/protected-route'
import { RentalModule } from '@/modules/rental'
import { LauncherPage } from '@/routes/launcher-page'
import { LoginPage } from '@/routes/login-page'
import { ModuleComingSoonPage } from '@/routes/module-coming-soon'
import { AdminShell } from '@/routes/admin/admin-shell'
import { ContentPage } from '@/routes/admin/content-page'
import { LeadsPage } from '@/routes/admin/leads-page'
import { SiteHome } from '@/site/home'

// The marketing pages are heavy (framer-motion, canvas backdrops) and most
// visits are to one of them, so everything past the home page is split out.
const About = lazy(() => import('@/site/views/About'))
const Services = lazy(() => import('@/site/views/Services'))
const Portfolio = lazy(() => import('@/site/views/Portfolio'))
const Blog = lazy(() => import('@/site/views/Blog'))
const BlogPost = lazy(() => import('@/site/views/BlogPost'))
const Contact = lazy(() => import('@/site/views/Contact'))
const RequestQuote = lazy(() => import('@/site/views/RequestQuote'))

function PageFallback() {
  return <div className="itoby-site min-h-svh" aria-busy="true" />
}

/**
 * Superapp route table.
 *
 *   /               Itoby public site — anonymous, no sign-in
 *   /login          one sign-in for all three roles
 *   /app            launcher — tiles from modules_for_current_user()
 *   /app/rental/*   the rental CRM, behind a splat so the tree uses relative paths
 *   /app/:key       registered-but-unbuilt modules, rendered from their own row
 *
 * Auth sits at the product boundary, not the front door: a visitor browses the
 * site freely and is sent to /login only when opening a product that needs an
 * account. ProtectedRoute records where they were headed so they land back on
 * it after signing in.
 */
export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<SiteHome />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/request-quote" element={<RequestQuote />} />
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
