import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell  from '@/components/shared/AppShell'
import Dashboard from '@/pages/Dashboard'
import Finance   from '@/pages/Finance'
import Nutrition from '@/pages/Nutrition'
import Wellness  from '@/pages/Wellness'
import Workout   from '@/pages/Workout'
import Journal   from '@/pages/Journal'
import Settings  from '@/pages/Settings'

// HashRouter is used instead of BrowserRouter so GitHub Pages
// doesn't 404 on direct URL access — no server-side config needed.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
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
    </HashRouter>
  )
}
