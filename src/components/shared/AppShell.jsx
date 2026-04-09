import { NavLink, Outlet } from 'react-router-dom'
import { exportData } from '@/lib/store'

const NAV = [
  { to: '/',          label: 'Dashboard', dot: '#c9993a' },
  { to: '/finance',   label: 'Finance',   dot: '#3db88a' },
  { to: '/nutrition', label: 'Nutrition', dot: '#d9644a' },
  { to: '/wellness',  label: 'Wellness',  dot: '#4a7be0' },
  { to: '/workout',   label: 'Workout',   dot: '#8a6ed8' },
  { to: '/journal',   label: 'Journal',   dot: '#52504d' },
  { to: '/settings',  label: 'Settings',  dot: '#52504d' },
]

export default function AppShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 196, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '0 0 16px' }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--gold2)', letterSpacing: '0.02em' }}>FOLIO</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Digital Bullet Journal</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                textDecoration: 'none', marginBottom: 2,
                background: isActive ? 'var(--bg4)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text2)',
                fontSize: 14, fontWeight: isActive ? 500 : 400,
                transition: 'all 0.12s',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? item.dot : 'var(--bg5)', flexShrink: 0, transition: 'background 0.15s' }} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Export */}
        <div style={{ padding: '10px 8px 0', borderTop: '1px solid var(--border)' }}>
          <button onClick={exportData} style={{
            width: '100%', padding: '8px 12px', background: 'none',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
            transition: 'all 0.15s', textAlign: 'left',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            ↓ Export backup
          </button>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8, padding: '0 4px', lineHeight: 1.5 }}>
            Data saved locally in your browser
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        <Outlet />
      </main>
    </div>
  )
}
