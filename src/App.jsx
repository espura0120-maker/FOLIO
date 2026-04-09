import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import ProtectedRoute   from '@/components/auth/ProtectedRoute'
import AppShell   from '@/components/shared/AppShell'
import AuthPage   from '@/pages/AuthPage'
import Dashboard  from '@/pages/Dashboard'
import Finance    from '@/pages/Finance'
import Nutrition  from '@/pages/Nutrition'
import Wellness   from '@/pages/Wellness'
import Workout    from '@/pages/Workout'
import Journal    from '@/pages/Journal'
import Settings   from '@/pages/Settings'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }>
            <Route index          element={<Dashboard />} />
            <Route path="finance"   element={<Finance />} />
            <Route path="nutrition" element={<Nutrition />} />
            <Route path="wellness"  element={<Wellness />} />
            <Route path="workout"   element={<Workout />} />
            <Route path="journal"   element={<Journal />} />
            <Route path="settings"  element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
