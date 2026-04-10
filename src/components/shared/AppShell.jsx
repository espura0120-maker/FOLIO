import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard', dot: '#c9993a', icon: '◈'  },
  { to: '/schedule',  label: 'Schedule',  dot: '#3db88a', icon: '📅' },
  { to: '/finance',   label: 'Finance',   dot: '#3db88a', icon: '💰' },
  { to: '/nutrition', label: 'Nutrition', dot: '#d9644a', icon: '🍽' },
  { to: '/wellness',  label: 'Wellness',  dot: '#4a7be0', icon: '🎯' },
  { to: '/workout',   label: 'Workout',   dot: '#8a6ed8', icon: '🏋️' },
  { to: '/journal',   label: 'Journal',   dot: '#c9993a', icon: '✍️' },
  { to: '/settings',  label: 'Settings',  dot: '#52504d', icon: '⚙️' },
]

export default function AppShell() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <style>{`
        .app-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: transparent;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 210px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          padding: 0 0 16px;
          position: relative;
          background: rgba(255,255,255,0.03);
          border-right: 1px solid rgba(255,255,255,0.07);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        .sidebar::before {
          content: '';
          position: absolute;
          top: -60px;
          left: -60px;
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, rgba(201,153,58,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 14px;
          border-radius: 12px;
          text-decoration: none;
          margin-bottom: 2px;
          color: rgba(240,237,232,0.45);
          font-size: 14px;
          font-weight: 400;
          transition: all 0.2s;
          position: relative;
        }

        .nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: rgba(240,237,232,0.8);
        }

        .nav-link.active {
          background: rgba(201,153,58,0.12);
          border: 1px solid rgba(201,153,58,0.20);
          color: #e8b85a;
          font-weight: 500;
          box-shadow: 0 0 16px rgba(201,153,58,0.08);
        }

        .nav-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
          transition: all 0.2s;
          background: rgba(255,255,255,0.15);
        }

        .nav-link.active .nav-dot {
          box-shadow: 0 0 6px currentColor;
        }

        .main-content {
          flex: 1;
          overflow: auto;
          padding: 28px 32px;
          position: relative;
        }

        .mobile-topbar { display: none; }
        .bottom-nav    { display: none; }

        @media (max-width: 640px) {
          .app-layout { flex-direction: column; height: 100dvh; }
          .sidebar { display: none; }
          .main-content { flex: 1; overflow: auto; padding: 14px 14px 84px; }
          .mobile-topbar {
            display: flex; align-items: center; justify-content: space-between;
            padding: 14px 16px 12px;
            border-bottom: 1px solid rgba(255,255,255,0.07);
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            flex-shrink: 0;
          }
          .bottom-nav {
            display: flex; position: fixed;
            bottom: 0; left: 0; right: 0;
            height: 64px;
            background: rgba(8,10,15,0.85);
            border-top: 1px solid rgba(255,255,255,0.08);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            z-index: 100;
            padding-bottom: env(safe-area-inset-bottom, 0px);
            overflow-x: auto;
          }
          .bottom-nav a {
            flex: 1; min-width: 52px;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 2px; text-decoration: none;
            color: rgba(240,237,232,0.35); font-size: 9px;
            transition: color 0.15s;
            -webkit-tap-highlight-color: transparent;
          }
          .bottom-nav a.active { color: #e8b85a; }
          .bottom-nav .nav-icon { font-size: 18px; line-height: 1; }
        }
      `}</style>

      <div className="app-layout">

        {/* Desktop sidebar */}
        <aside className="sidebar">
          {/* Logo */}
          <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 24, color: '#e8b85a', letterSpacing: '0.04em', textShadow: '0 0 20px rgba(232,184,90,0.4)' }}>
              FOLIO
            </div>
            <div style={{ fontSize: 11, color: 'rgba(240,237,232,0.3)', marginTop: 3, letterSpacing: '0.05em' }}>Digital Bullet Journal</div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                style={({ isActive }) => ({ color: isActive ? item.dot : undefined })}
              >
                {({ isActive }) => (
                  <>
                    <span className="nav-dot" style={{ background: isActive ? item.dot : undefined }} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: '12px 10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(201,153,58,0.15)',
                border: '1px solid rgba(201,153,58,0.3)',
                color: '#e8b85a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600,
                boxShadow: '0 0 10px rgba(201,153,58,0.15)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>
                  {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
                </div>
                <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.3)', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(240,237,232,0.3)'}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#e8b85a', textShadow: '0 0 16px rgba(232,184,90,0.4)' }}>FOLIO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(201,153,58,0.15)', border: '1px solid rgba(201,153,58,0.3)', color: '#e8b85a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
              {initials}
            </div>
            <button onClick={handleSignOut} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: 'var(--text2)', fontSize: 12, cursor: 'pointer', padding: '5px 12px', fontFamily: 'inherit' }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Main */}
        <main className="main-content">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
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
