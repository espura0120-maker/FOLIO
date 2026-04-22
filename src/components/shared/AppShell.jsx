import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import DynamicWave from '@/components/shared/WaveColor'
import { ConfettiRoot } from '@/components/shared/Confetti'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FS = "'DM Serif Display',Georgia,serif"

const ICONS = {
  dashboard:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  insights:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  schedule:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  finance:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  nutrition:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  wellness:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  workout:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18"/></svg>,
  journal:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  media:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  cycle:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  settings:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  dailylog:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  habits:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  weeklyreview:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>,
}

const NAV = [
  // ── Core ─────────────────────────────────────────────────
  { to:'/',              label:'Dashboard',     icon:'dashboard',    accent:'#f5c842' },
  { to:'/insights',      label:'Insights',      icon:'insights',     accent:'#a88ef0' },
  // ── Bullet Journal ────────────────────────────────────────
  { to:'/daily-log',     label:'Daily Log',     icon:'dailylog',     accent:'#f5c842', divider:'Journal' },
  { to:'/habits',        label:'Habits',        icon:'habits',       accent:'#5dd4a6' },
  { to:'/weekly-review', label:'Weekly Review', icon:'weeklyreview', accent:'#a88ef0' },
  { to:'/journal',       label:'Journal',       icon:'journal',      accent:'#6a96f0' },
  // ── Life Tracking ─────────────────────────────────────────
  { to:'/schedule',      label:'Schedule',      icon:'schedule',     accent:'#3db88a', divider:'Tracking' },
  { to:'/finance',       label:'Finance',       icon:'finance',      accent:'#f5c842' },
  { to:'/nutrition',     label:'Nutrition',     icon:'nutrition',    accent:'#f07a62' },
  { to:'/wellness',      label:'Wellness',      icon:'wellness',     accent:'#6a96f0' },
  { to:'/workout',       label:'Workout',       icon:'workout',      accent:'#a88ef0' },
  { to:'/media',         label:'Media',         icon:'media',        accent:'#6a96f0' },
  { to:'/cycle',         label:'Cycle',         icon:'cycle',        accent:'#ed93b1', pink:true },
  // ── System ────────────────────────────────────────────────
  { to:'/settings',      label:'Settings',      icon:'settings',     accent:'#888780', divider:'System' },
]

export default function AppShell() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const activeNav   = NAV.find(n => n.to !== '/' ? location.pathname.startsWith(n.to) : location.pathname === '/') || NAV[0]
  const accentColor = activeNav?.accent || '#f5c842'

  async function handleSignOut() { await signOut(); navigate('/auth') }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  // Bottom nav — most important pages only for mobile
  const MOBILE_NAV = [
    NAV.find(n => n.to === '/'),
    NAV.find(n => n.to === '/daily-log'),
    NAV.find(n => n.to === '/habits'),
    NAV.find(n => n.to === '/finance'),
    NAV.find(n => n.to === '/journal'),
    NAV.find(n => n.to === '/schedule'),
    NAV.find(n => n.to === '/workout'),
    NAV.find(n => n.to === '/settings'),
  ].filter(Boolean)

  return (
    <>
      <style>{`
        *{font-family:${F}!important;}
        .al{display:flex;height:100vh;overflow:hidden;background:#0e0f16;position:relative;}
        .sb{width:222px;flex-shrink:0;display:flex;flex-direction:column;padding:0 0 14px;background:rgba(255,255,255,0.032);border-right:1px solid rgba(255,255,255,0.065);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);position:relative;z-index:2;}
        .nl{display:flex;align-items:center;gap:9px;padding:8px 12px;border-radius:11px;text-decoration:none;margin-bottom:1px;color:rgba(255,255,255,0.38);font-size:13px;font-weight:500;transition:all 0.18s;border:1px solid transparent;}
        .nl:hover{background:rgba(255,255,255,0.055);color:rgba(255,255,255,0.75);}
        .nl.act{background:rgba(245,200,66,0.11);border-color:rgba(245,200,66,0.22);color:#f5c842;font-weight:700;}
        .nl.acp{background:rgba(212,83,126,0.10);border-color:rgba(212,83,126,0.22);color:#ed93b1;font-weight:700;}
        .nl .ni{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.18s;}
        .nl:hover .ni,.nl.act .ni,.nl.acp .ni{background:rgba(255,255,255,0.08);}
        .nav-divider{font-size:9px;font-weight:700;color:rgba(255,255,255,0.18);letter-spacing:0.10em;text-transform:uppercase;padding:10px 12px 4px;margin-top:4px;}
        .mc{flex:1;overflow:auto;padding:28px 30px;position:relative;z-index:2;}
        .mt{display:none;}.bn{display:none;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .fade-up{animation:fadeUp 0.26s ease both}
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(max-width:640px){
          .al{flex-direction:column;height:100dvh;}
          .sb{display:none;}
          .mc{flex:1;overflow:auto;padding:14px 14px 80px;}
          .mt{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.065);background:rgba(255,255,255,0.03);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);flex-shrink:0;position:relative;z-index:2;}
          .bn{display:flex;position:fixed;bottom:0;left:0;right:0;height:62px;background:rgba(14,15,22,0.92);border-top:1px solid rgba(255,255,255,0.07);z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);overflow-x:auto;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);}
          .bn a{flex:1;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;color:rgba(255,255,255,0.26);font-size:9px;font-weight:600;transition:color 0.15s;-webkit-tap-highlight-color:transparent;}
          .bn a.act{color:#f5c842;}.bn a.acp{color:#ed93b1;}
          .bn a.act .bni{transform:scale(1.12);}.bni{transition:transform 0.15s;}
        }
      `}</style>

      <ConfettiRoot />

      <div className="al">
        <DynamicWave />

        {/* Per-page accent glow */}
        <div style={{ position:'fixed', top:-100, right:-100, width:400, height:400, background:`radial-gradient(circle,${accentColor}13 0%,${accentColor}05 48%,transparent 70%)`, borderRadius:'50%', pointerEvents:'none', zIndex:1, transition:'background 0.7s ease' }} />

        {/* Sidebar */}
        <aside className="sb">
          <div style={{ padding:'20px 14px 16px', borderBottom:'1px solid rgba(255,255,255,0.065)' }}>
            <div style={{ fontFamily:FS, fontSize:22, color:'#f5c842', lineHeight:1, letterSpacing:'0.01em', filter:'drop-shadow(0 0 12px rgba(245,200,66,0.35))' }}>Folio</div>
            <div style={{ fontFamily:F, fontSize:10, color:'rgba(255,255,255,0.26)', marginTop:3, letterSpacing:'0.04em' }}>Digital Bullet Journal</div>
          </div>

          <nav style={{ flex:1, padding:'8px 8px', overflowY:'auto' }}>
            {NAV.map(item => (
              <div key={item.to}>
                {item.divider && (
                  <div className="nav-divider">{item.divider}</div>
                )}
                <NavLink to={item.to} end={item.to === '/'}
                  className={({ isActive }) => isActive ? (item.pink ? 'nl acp' : 'nl act') : 'nl'}
                  style={({ isActive }) => isActive && !item.pink ? { color:item.accent, background:item.accent+'16', borderColor:item.accent+'30' } : {}}>
                  <span className="ni">{ICONS[item.icon]}</span>
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <div style={{ padding:'10px 8px 0', borderTop:'1px solid rgba(255,255,255,0.065)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:10, background:'rgba(255,255,255,0.028)' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'rgba(245,200,66,0.13)', border:'1px solid rgba(245,200,66,0.26)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.68)' }}>{profile?.full_name || user?.email?.split('@')[0] || 'My Account'}</div>
                <button onClick={handleSignOut} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.28)', fontSize:11, cursor:'pointer', padding:0, transition:'color 0.15s', fontFamily:F }}
                  onMouseEnter={e => e.target.style.color='#f07a62'} onMouseLeave={e => e.target.style.color='rgba(255,255,255,0.28)'}>Sign out</button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="mt">
          <div style={{ fontFamily:FS, fontSize:18, color:'#f5c842' }}>Folio</div>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(245,200,66,0.13)', border:'1px solid rgba(245,200,66,0.26)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
        </div>

        {/* Main content */}
        <main className="mc" key={location.pathname} style={{ animation:'fadeUp 0.26s ease both' }}>
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="bn">
          {MOBILE_NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}
              className={({ isActive }) => isActive ? (item.pink ? 'acp' : 'act') : ''}
              style={({ isActive }) => isActive && !item.pink ? { color:item.accent } : {}}>
              <span className="bni" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:20, height:20 }}>{ICONS[item.icon]}</span>
              <span style={{ fontSize:9 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
