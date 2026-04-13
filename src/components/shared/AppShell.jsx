import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const F = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const ICONS = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  schedule: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  finance: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
    </svg>
  ),
  nutrition: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  wellness: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  workout: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 10h18M3 14h18"/>
    </svg>
  ),
  journal: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  cycle: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
}

const NAV = [
  { to:'/',          label:'Dashboard', icon:'dashboard' },
  { to:'/schedule',  label:'Schedule',  icon:'schedule'  },
  { to:'/finance',   label:'Finance',   icon:'finance'   },
  { to:'/nutrition', label:'Nutrition', icon:'nutrition' },
  { to:'/wellness',  label:'Wellness',  icon:'wellness'  },
  { to:'/workout',   label:'Workout',   icon:'workout'   },
  { to:'/journal',   label:'Journal',   icon:'journal'   },
  { to:'/cycle',     label:'Cycle',     icon:'cycle',    pink:true },
  { to:'/settings',  label:'Settings',  icon:'settings'  },
]

function Wave() {
  return (
    <div style={{ position:'fixed', bottom:-10, left:'-10%', width:'120%', height:300, pointerEvents:'none', zIndex:1 }}>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv3 9s ease-in-out infinite', opacity:0.10 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g3w" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#f5c842" stopOpacity="0"/>
            <stop offset="30%"  stopColor="#f7d060" stopOpacity="1"/>
            <stop offset="70%"  stopColor="#e8994a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#f5c842" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,180 C150,120 250,200 400,160 S650,80 800,140 S1050,200 1200,150 L1200,280 L0,280 Z" fill="url(#g3w)"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv2 7s ease-in-out infinite', opacity:0.16 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g2w" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#c9993a" stopOpacity="0"/>
            <stop offset="25%"  stopColor="#f5c842" stopOpacity="1"/>
            <stop offset="60%"  stopColor="#f7d060" stopOpacity="1"/>
            <stop offset="100%" stopColor="#e8994a" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,200 C100,150 200,240 350,180 S600,100 750,170 S1000,230 1200,170 L1200,280 L0,280 Z" fill="url(#g2w)"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv1 5.5s ease-in-out infinite', opacity:0.26 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1w" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#f5c842" stopOpacity="0"/>
            <stop offset="20%"  stopColor="#f5c842" stopOpacity="1"/>
            <stop offset="50%"  stopColor="#fae090" stopOpacity="1"/>
            <stop offset="80%"  stopColor="#e8994a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#f5c842" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,220 C80,170 180,250 320,200 S550,120 700,190 S950,250 1200,195 L1200,280 L0,280 Z" fill="url(#g1w)"/>
      </svg>
      <div style={{ position:'absolute', bottom:-30, left:'50%', transform:'translateX(-50%)', width:600, height:160, background:'radial-gradient(ellipse, rgba(245,200,66,0.20) 0%, transparent 70%)', borderRadius:'50%', animation:'gp 6s ease-in-out infinite' }} />
    </div>
  )
}

export default function AppShell() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() { await signOut(); navigate('/auth') }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <style>{`
        @keyframes wv1 { 0%{transform:translateX(0) scaleY(1)} 25%{transform:translateX(-60px) translateY(8px) scaleY(1.04)} 50%{transform:translateX(-120px) translateY(0) scaleY(0.97)} 75%{transform:translateX(-60px) translateY(-8px) scaleY(1.03)} 100%{transform:translateX(0) scaleY(1)} }
        @keyframes wv2 { 0%{transform:translateX(0) scaleY(1)} 33%{transform:translateX(80px) translateY(-10px) scaleY(1.05)} 66%{transform:translateX(-40px) translateY(6px) scaleY(0.96)} 100%{transform:translateX(0) scaleY(1)} }
        @keyframes wv3 { 0%{transform:translateX(-40px) translateY(4px)} 50%{transform:translateX(40px) translateY(-4px)} 100%{transform:translateX(-40px) translateY(4px)} }
        @keyframes gp  { 0%,100%{opacity:.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.08)} }
        *{font-family:${F}!important;}
        .al{display:flex;height:100vh;overflow:hidden;background:#0e0f16;position:relative;}
        .sb{
          width:220px;flex-shrink:0;display:flex;flex-direction:column;padding:0 0 16px;
          background:rgba(255,255,255,0.035);
          border-right:1px solid rgba(255,255,255,0.07);
          backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          position:relative;z-index:2;
        }
        .nl{
          display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;
          text-decoration:none;margin-bottom:2px;color:rgba(255,255,255,0.40);
          font-size:13px;font-weight:500;transition:all 0.18s;border:1px solid transparent;
        }
        .nl:hover{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.78);}
        .nl.act{background:rgba(245,200,66,0.13);border-color:rgba(245,200,66,0.25);color:#f5c842;font-weight:700;}
        .nl.acp{background:rgba(212,83,126,0.11);border-color:rgba(212,83,126,0.24);color:#ed93b1;font-weight:700;}
        .mc{flex:1;overflow:auto;padding:28px 30px;position:relative;z-index:2;}
        .mt{display:none;} .bn{display:none;}
        @media(max-width:640px){
          .al{flex-direction:column;height:100dvh;}
          .sb{display:none;}
          .mc{flex:1;overflow:auto;padding:14px 14px 84px;}
          .mt{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.035);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);flex-shrink:0;position:relative;z-index:2;}
          .bn{display:flex;position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(14,15,22,0.85);border-top:1px solid rgba(255,255,255,0.08);z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);overflow-x:auto;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);}
          .bn a{flex:1;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:rgba(255,255,255,0.28);font-size:9px;font-weight:600;transition:color 0.15s;-webkit-tap-highlight-color:transparent;}
          .bn a.act{color:#f5c842;} .bn a.acp{color:#ed93b1;}
        }
      `}</style>

      <div className="al">
        <Wave />

        <aside className="sb">
          <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#f5c842', letterSpacing:'0.04em' }}>FOLIO</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:3 }}>Digital Bullet Journal</div>
          </div>

          <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to==='/'}
                className={({ isActive }) => isActive ? (item.pink ? 'nl acp' : 'nl act') : 'nl'}>
                {ICONS[item.icon]}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding:'10px 10px 0', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.70)' }}>
                  {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
                </div>
                <button onClick={handleSignOut} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.30)', fontSize:11, cursor:'pointer', padding:0 }}
                  onMouseEnter={e=>e.target.style.color='#f07a62'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.30)'}>Sign out</button>
              </div>
            </div>
          </div>
        </aside>

        <div className="mt">
          <div style={{ fontSize:18, fontWeight:800, color:'#f5c842' }}>FOLIO</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
            <button onClick={handleSignOut} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', borderRadius:8, color:'rgba(255,255,255,0.55)', fontSize:12, cursor:'pointer', padding:'5px 12px' }}>Sign out</button>
          </div>
        </div>

        <main className="mc"><Outlet /></main>

        <nav className="bn">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              className={({ isActive }) => isActive ? (item.pink ? 'acp' : 'act') : ''}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', width:20, height:20 }}>{ICONS[item.icon]}</span>
              <span style={{ fontSize:9 }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
