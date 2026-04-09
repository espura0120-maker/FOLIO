import { NavLink, Outlet } from 'react-router-dom'

const NAV = [
  { to: '/',          label: 'Dashboard', dot: '#c9993a', icon: '◈'  },
  { to: '/finance',   label: 'Finance',   dot: '#3db88a', icon: '💰' },
  { to: '/nutrition', label: 'Nutrition', dot: '#d9644a', icon: '🍽' },
  { to: '/wellness',  label: 'Wellness',  dot: '#4a7be0', icon: '🎯' },
  { to: '/workout',   label: 'Workout',   dot: '#8a6ed8', icon: '🏋️' },
  { to: '/journal',   label: 'Journal',   dot: '#c9993a', icon: '✍️' },
  { to: '/settings',  label: 'Settings',  dot: '#52504d', icon: '⚙️' },
]

export default function AppShell() {
  return (
    <>
      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: var(--bg);
        }
        .sidebar {
          width: 196px;
          flex-shrink: 0;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 0 0 16px;
        }
        .main-content {
          flex: 1;
          overflow: auto;
          padding: 24px 28px;
        }
        .mobile-topbar { display: none; }
        .bottom-nav    { display: none; }

        @media (max-width: 640px) {
          .app-layout { flex-direction: column; height: 100dvh; }
          .sidebar { display: none; }
          .main-content {
            flex: 1;
            overflow: auto;
            padding: 12px 14px 80px;
          }
          .mobile-topbar {
            display: flex;
            align-items: center;
            padding: 14px 16px 10px;
            border-bottom: 1px solid var(--border);
            background: var(--bg2);
            flex-shrink: 0;
          }
          .bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 62px;
            background: var(--bg2);
            border-top: 1px solid var(--border);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .bottom-nav a {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            text-decoration: none;
            color: var(--text3);
            font-size: 9px;
            letter-spacing: 0.02em;
            transition: color 0.15s;
            -webkit-tap-highlight-color: transparent;
          }
          .bottom-nav a.active { color: var(--text); }
          .bottom-nav .nav-icon { font-size: 19px; line-height: 1; }
        }
      `}</style>

      <div className="app-layout">

        {/* Desktop sidebar */}
        <aside className="sidebar">
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 22, color: 'var(--gold2)', letterSpacing: '0.02em' }}>FOLIO</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Digital Bullet Journal</div>
          </div>
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
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: isActive ? item.dot : 'var(--bg5)', flexShrink: 0 }} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '10px 8px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', padding: '0 4px', lineHeight: 1.5 }}>Data saved in Supabase</div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--gold2)', letterSpacing: '0.02em' }}>FOLIO</div>
        </div>

        {/* Main */}
        <main className="main-content">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
              style={({ isActive }) => ({ color: isActive ? item.dot : undefined })}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

      </div>
    </>
  )
}
