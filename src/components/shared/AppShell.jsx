import React from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import DynamicWave from '@/components/shared/WaveColor'
import { ConfettiRoot } from '@/components/shared/Confetti'

const NAV = [
  { to: '/',          label: 'Dashboard', accent: '#f5c842' },
  { to: '/insights',  label: 'Insights',  accent: '#a88ef0' },
  { to: '/schedule',  label: 'Schedule',  accent: '#3db88a' },
  { to: '/finance',   label: 'Finance',   accent: '#f5c842' },
  { to: '/nutrition', label: 'Nutrition', accent: '#f07a62' },
  { to: '/wellness',  label: 'Wellness',  accent: '#6a96f0' },
  { to: '/workout',   label: 'Workout',   accent: '#a88ef0' },
  { to: '/journal',   label: 'Journal',   accent: '#f5c842' },
  { to: '/media',     label: 'Media',     accent: '#5dd4a6' },
  { to: '/cycle',     label: 'Cycle',     accent: '#ed93b1', pink: true },
  { to: '/settings',  label: 'Settings',  accent: '#888780' },
]

function I({ d, fill }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={fill || 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICON_MAP = {
  '/':          <I d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  '/insights':  <I d="M22 12 18 12 15 21 9 3 6 12 2 12" />,
  '/schedule':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  '/finance':   <I d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />,
  '/nutrition': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  '/wellness':  <I d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  '/workout':   <I d="M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18" />,
  '/journal':   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  '/media':   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  '/cycle':     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  '/settings':  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
}

export default function AppShell() {
  const { user, profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const activeNav   = NAV.find(n => n.to !== '/' ? location.pathname.startsWith(n.to) : location.pathname === '/') || NAV[0]
  const accentColor = activeNav ? activeNav.accent : '#f5c842'

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  const initials = profile && profile.full_name
    ? profile.full_name.split(' ').map(function(n) { return n[0] }).join('').toUpperCase().slice(0, 2)
    : (user && user.email ? user.email[0].toUpperCase() : '?')

  const displayName = profile && profile.full_name
    ? profile.full_name
    : (user && user.email ? user.email.split('@')[0] : 'My Account')

  return (
    <div>
      <style>{[
        '@keyframes wv1{0%{transform:translateX(0) scaleY(1)}25%{transform:translateX(-60px) translateY(8px) scaleY(1.04)}50%{transform:translateX(-120px) scaleY(0.97)}75%{transform:translateX(-60px) translateY(-8px) scaleY(1.03)}100%{transform:translateX(0) scaleY(1)}}',
        '@keyframes wv2{0%{transform:translateX(0) scaleY(1)}33%{transform:translateX(80px) translateY(-10px) scaleY(1.05)}66%{transform:translateX(-40px) translateY(6px) scaleY(0.96)}100%{transform:translateX(0) scaleY(1)}}',
        '@keyframes wv3{0%{transform:translateX(-40px) translateY(4px)}50%{transform:translateX(40px) translateY(-4px)}100%{transform:translateX(-40px) translateY(4px)}}',
        '@keyframes gp{0%,100%{opacity:.6;transform:translateX(-50%) scale(1)}50%{opacity:1;transform:translateX(-50%) scale(1.08)}}',
        '@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
        '@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}',
        '@keyframes spin{to{transform:rotate(360deg)}}',
        '@keyframes fadeIn{from{opacity:0}to{opacity:1}}',
        '*{font-family:"Plus Jakarta Sans",system-ui,sans-serif!important;}',
        '.folio-layout{display:flex;height:100vh;overflow:hidden;background:#0e0f16;position:relative;}',
        '.folio-sidebar{width:222px;flex-shrink:0;display:flex;flex-direction:column;padding:0 0 14px;background:rgba(255,255,255,0.032);border-right:1px solid rgba(255,255,255,0.065);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);position:relative;z-index:2;}',
        '.folio-main{flex:1;overflow:auto;padding:28px 30px;position:relative;z-index:2;}',
        '.fnl{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:11px;text-decoration:none;margin-bottom:1px;color:rgba(255,255,255,0.38);font-size:13px;font-weight:500;transition:all 0.18s;border:1px solid transparent;}',
        '.fnl:hover{background:rgba(255,255,255,0.055);color:rgba(255,255,255,0.75);}',
        '.fnl .ni{width:27px;height:27px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.18s;}',
        '.fnl:hover .ni{background:rgba(255,255,255,0.08);}',
        '.folio-mob-top{display:none;}',
        '.folio-bot-nav{display:none;}',
        '@media(max-width:640px){',
        '.folio-layout{flex-direction:column;height:100dvh;}',
        '.folio-sidebar{display:none;}',
        '.folio-main{flex:1;overflow:auto;padding:14px 14px 80px;}',
        '.folio-mob-top{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.065);background:rgba(255,255,255,0.03);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);flex-shrink:0;position:relative;z-index:2;}',
        '.folio-bot-nav{display:flex;position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(14,15,22,0.92);border-top:1px solid rgba(255,255,255,0.07);z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);overflow-x:auto;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);}',
        '.folio-bot-nav a{flex:1;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;color:rgba(255,255,255,0.26);font-size:9px;font-weight:600;transition:color 0.15s;-webkit-tap-highlight-color:transparent;}',
        '.folio-bot-nav a.act{color:#f5c842;}',
        '.folio-bot-nav a.acp{color:#ed93b1;}',
        '}',
      ].join('')}</style>

      <ConfettiRoot />

      <div className="folio-layout">
        <DynamicWave />

        <div style={{ position: 'fixed', top: -100, right: -100, width: 380, height: 380, background: 'radial-gradient(circle,' + accentColor + '13 0%,' + accentColor + '05 48%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 1, transition: 'background 0.7s ease' }} />

        <aside className="folio-sidebar">
          <div style={{ padding: '20px 14px 16px', borderBottom: '1px solid rgba(255,255,255,0.065)' }}>
            <div style={{ fontFamily: '"DM Serif Display",Georgia,serif', fontSize: 22, color: '#f5c842', lineHeight: 1, filter: 'drop-shadow(0 0 10px rgba(245,200,66,0.35))' }}>Folio</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 3, letterSpacing: '0.04em' }}>Digital Bullet Journal</div>
          </div>

          <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
            {NAV.map(function(item) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={function(p) { return p.isActive ? 'fnl' : 'fnl' }}
                  style={function(p) {
                    if (!p.isActive) return {}
                    if (item.pink) return { color: '#ed93b1', background: 'rgba(212,83,126,0.10)', borderColor: 'rgba(212,83,126,0.22)', fontWeight: 700 }
                    return { color: item.accent, background: item.accent + '16', borderColor: item.accent + '30', fontWeight: 700 }
                  }}
                >
                  <span className="ni" style={{}}>
                    {ICON_MAP[item.to]}
                  </span>
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div style={{ padding: '10px 8px 0', borderTop: '1px solid rgba(255,255,255,0.065)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.028)' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'rgba(245,200,66,0.13)', border: '1px solid rgba(245,200,66,0.26)', color: '#f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.68)' }}>{displayName}</div>
                <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                  onMouseEnter={function(e) { e.target.style.color = '#f07a62' }}
                  onMouseLeave={function(e) { e.target.style.color = 'rgba(255,255,255,0.28)' }}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="folio-mob-top">
          <div style={{ fontFamily: '"DM Serif Display",Georgia,serif', fontSize: 18, color: '#f5c842' }}>Folio</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,200,66,0.13)', border: '1px solid rgba(245,200,66,0.26)', color: '#f5c842', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
            {initials}
          </div>
        </div>

        <main className="folio-main" key={location.pathname} style={{ animation: 'fadeUp 0.26s ease both' }}>
          <Outlet />
        </main>

        <nav className="folio-bot-nav">
          {NAV.map(function(item) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={function(p) { return p.isActive ? (item.pink ? 'acp' : 'act') : '' }}
                style={function(p) { return p.isActive && !item.pink ? { color: item.accent } : {} }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20 }}>
                  {ICON_MAP[item.to]}
                </span>
                <span style={{ fontSize: 9 }}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
