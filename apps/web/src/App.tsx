import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedRoute } from '@/auth/protected-route'
import { RentalModule } from '@/modules/rental'
import { AdminShell } from '@/routes/admin/admin-shell'
import { ContentPage } from '@/routes/admin/content-page'
import { LeadsPage } from '@/routes/admin/leads-page'
import { HomePage } from '@/routes/home-page'
import { LauncherPage } from '@/routes/launcher-page'
import { LoginPage } from '@/routes/login-page'
import { ModuleComingSoonPage } from '@/routes/module-coming-soon'

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
    <Routes>
      <Route path="/" element={<HomePage />} />
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
  )
}
