import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/lib/AuthContext'
import { ToastProvider } from '@/components/shared/Toast'
import ProtectedRoute    from '@/components/auth/ProtectedRoute'
import AppShell   from '@/components/shared/AppShell'
import AuthPage   from '@/pages/AuthPage'
import Dashboard  from '@/pages/Dashboard'
import Insights   from '@/pages/Insights'
import Schedule   from '@/pages/Schedule'
import Finance    from '@/pages/Finance'
import Nutrition  from '@/pages/Nutrition'
import Wellness   from '@/pages/Wellness'
import Workout    from '@/pages/Workout'
import Journal    from '@/pages/Journal'
import Media     from '@/pages/Media'
import Cycle      from '@/pages/Cycle'
import Settings   from '@/pages/Settings'
import DailyLog      from '@/pages/DailyLog'
import HabitTracker  from '@/pages/HabitTracker'
import WeeklyReview  from '@/pages/WeeklyReview'

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index             element={<Dashboard />} />
              <Route path="insights"   element={<Insights />} />
              <Route path="schedule"   element={<Schedule />} />
              <Route path="finance"    element={<Finance />} />
              <Route path="nutrition"  element={<Nutrition />} />
              <Route path="wellness"   element={<Wellness />} />
              <Route path="workout"    element={<Workout />} />
              <Route path="journal"    element={<Journal />} />
              <Route path="media"     element={<Media />} />
              <Route path="cycle"      element={<Cycle />} />
              <Route path="settings"   element={<Settings />} />
              <Route path="/daily-log"     element={<DailyLog />} />
              <Route path="/habits"        element={<HabitTracker />} />
              <Route path="/weekly-review" element={<WeeklyReview />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
