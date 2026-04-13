import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', type: 'path' },
  { to: '/schedule',  label: 'Schedule',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', type: 'stroke' },
  { to: '/finance',   label: 'Finance',   icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z', type: 'path' },
  { to: '/nutrition', label: 'Nutrition', icon: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3', type: 'stroke' },
  { to: '/wellness',  label: 'Wellness',  icon: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3', type: 'stroke' },
  { to: '/workout',   label: 'Workout',   icon: 'M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18', type: 'stroke' },
  { to: '/journal',   label: 'Journal',   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', type: 'stroke' },
  { to: '/cycle',     label: 'Cycle',     icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z', type: 'path', pink: true },
  { to: '/settings',  label: 'Settings',  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', type: 'stroke' },
]

function NavIcon({ item, isActive }) {
  const color = isActive ? (item.pink ? '#ed93b1' : '#f5c842') : 'rgba(255,255,255,0.38)'
  if (item.type === 'path') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
        <path d={item.icon} />
      </svg>
    )
  }
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={item.icon} />
    </svg>
  )
}

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
        .app-layout { display:flex; height:100vh; overflow:hidden; background:#0e0f16; }

        .sidebar {
          width:220px; flex-shrink:0;
          display:flex; flex-direction:column; padding:0 0 16px;
          background:#12131a;
          border-right:1px solid rgba(255,255,255,0.06);
        }

        .nav-link {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; border-radius:12px;
          text-decoration:none; margin-bottom:2px;
          color:rgba(255,255,255,0.38);
          font-size:13px; font-weight:500;
          transition:all 0.18s;
          border:1px solid transparent;
        }
        .nav-link:hover {
          background:#1c1e2b;
          color:rgba(255,255,255,0.70);
        }
        .nav-link.active {
          background:#1c1e2b;
          border-color:rgba(245,200,66,0.18);
          color:#f5c842;
          font-weight:600;
        }
        .nav-link.active-pink {
          background:#1c1e2b;
          border-color:rgba(212,83,126,0.20);
          color:#ed93b1 !important;
          font-weight:600;
        }

        .main-content { flex:1; overflow:auto; padding:28px 30px; }
        .mobile-topbar { display:none; }
        .bottom-nav    { display:none; }

        @media (max-width:640px) {
          .app-layout { flex-direction:column; height:100dvh; }
          .sidebar { display:none; }
          .main-content { flex:1; overflow:auto; padding:14px 14px 84px; }
          .mobile-topbar {
            display:flex; align-items:center; justify-content:space-between;
            padding:14px 16px 12px;
            border-bottom:1px solid rgba(255,255,255,0.06);
            background:#12131a; flex-shrink:0;
          }
          .bottom-nav {
            display:flex; position:fixed;
            bottom:0; left:0; right:0; height:64px;
            background:#12131a;
            border-top:1px solid rgba(255,255,255,0.07);
            z-index:100;
            padding-bottom:env(safe-area-inset-bottom,0px);
            overflow-x:auto;
          }
          .bottom-nav a {
            flex:1; min-width:44px;
            display:flex; flex-direction:column;
            align-items:center; justify-content:center;
            gap:3px; text-decoration:none;
            color:rgba(255,255,255,0.28); font-size:9px; font-weight:500;
            transition:color 0.15s;
            -webkit-tap-highlight-color:transparent;
          }
          .bottom-nav a.active { color:#f5c842; }
          .bottom-nav a.active-pink { color:#ed93b1 !important; }
          .bn-icon { font-size:18px; line-height:1; }
        }
      `}</style>

      <div className="app-layout">
        <aside className="sidebar">
          {/* Logo */}
          <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 22, fontWeight: 800, color: '#f5c842', letterSpacing: '0.04em' }}>
              FOLIO
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', marginTop: 3, letterSpacing: '0.04em' }}>Digital Bullet Journal</div>
          </div>

          <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={({ isActive }) => {
                  if (!isActive) return 'nav-link'
                  return item.pink ? 'nav-link active-pink' : 'nav-link active'
                }}
              >
                {({ isActive }) => (
                  <>
                    <NavIcon item={item} isActive={isActive} />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div style={{ padding: '10px 10px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.30)', color: '#f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.70)' }}>
                  {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
                </div>
                <button onClick={handleSignOut}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#f07a62'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.28)'}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 18, fontWeight: 800, color: '#f5c842' }}>FOLIO</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.28)', color: '#f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{initials}</div>
            <button onClick={handleSignOut} style={{ background: '#1c1e2b', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(255,255,255,0.50)', fontSize: 12, cursor: 'pointer', padding: '5px 12px', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>

        <main className="main-content"><Outlet /></main>

        {/* Mobile bottom nav */}
        <nav className="bottom-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => {
                if (!isActive) return ''
                return item.pink ? 'active active-pink' : 'active'
              }}
            >
              <span className="bn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24"
                  fill={item.type === 'path' ? 'currentColor' : 'none'}
                  stroke={item.type === 'stroke' ? 'currentColor' : 'none'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
