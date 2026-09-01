import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from '@/auth/auth-provider'
import { ProtectedRoute } from '@/auth/protected-route'
import { AppShell } from '@/components/app-shell'
import { Toaster } from '@itoby/ui'
import { queryClient } from '@/lib/query-client'
import { ComplaintsScreen } from '@/routes/complaints'
import { DocumentsScreen } from '@/routes/documents'
import { HomeScreen } from '@/routes/home'
import { InvoicesScreen } from '@/routes/invoices'
import { LeaseScreen } from '@/routes/lease'
import { LoginScreen } from '@/routes/login'
import { ProfileScreen } from '@/routes/profile'
import { ReceiptsScreen } from '@/routes/receipts'
import { RemindersScreen } from '@/routes/reminders'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/home" element={<HomeScreen />} />
                <Route path="/lease" element={<LeaseScreen />} />
                <Route path="/invoices" element={<InvoicesScreen />} />
                <Route path="/reminders" element={<RemindersScreen />} />
                <Route path="/receipts" element={<ReceiptsScreen />} />
                <Route path="/complaints" element={<ComplaintsScreen />} />
                <Route path="/documents" element={<DocumentsScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
          <Toaster position="bottom-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
