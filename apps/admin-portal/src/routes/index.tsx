import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/auth/protected-route'
import { AppShell } from '@/components/layout/app-shell'
import { AllotmentsPage } from './allotments-page'
import { AuditPage } from './audit-page'
import { BillingPage } from './billing-page'
import { ComplaintsPage } from './complaints-page'
import { DashboardPage } from './dashboard-page'
import { DocumentsPage } from './documents-page'
import { LoginPage } from './login-page'
import { OwnersPage } from './owners-page'
import { SettingsPage } from './settings-page'
import { StaffPage } from './staff-page'
import { UnitsPage } from './units-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/units" element={<UnitsPage />} />
          <Route path="/allotments" element={<AllotmentsPage />} />
          <Route path="/owners" element={<OwnersPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
