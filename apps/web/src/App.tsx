import { Navigate, Route, Routes } from 'react-router-dom'

import { AppLayout } from '@/components/app-layout'
import { ProtectedRoute } from '@/auth/protected-route'
import { RentalModule } from '@/modules/rental'
import { LauncherPage } from '@/routes/launcher-page'
import { LoginPage } from '@/routes/login-page'
import { ModuleComingSoonPage } from '@/routes/module-coming-soon'
import { SiteHome } from '@/site/home'

/**
 * Superapp route table.
 *
 *   /               Itoby public site — anonymous, no sign-in
 *   /login          one sign-in for all three roles
 *   /app            launcher — tiles from modules_for_current_user()
 *   /app/rental/*   the rental CRM, behind a splat so the tree uses relative paths
 *   /app/:key       registered-but-unbuilt modules, rendered from their own row
 *
 * Auth is enforced at the product boundary, not at the front door: a visitor
 * browses the site freely and is sent to /login only when they open a product
 * that needs an account. ProtectedRoute records where they were headed, so
 * they land back on it after signing in.
 */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<SiteHome />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<LauncherPage />} />
          <Route path="rental/*" element={<RentalModule />} />
          <Route path=":moduleKey" element={<ModuleComingSoonPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
