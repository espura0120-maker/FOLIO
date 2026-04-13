import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const F = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"

const NAV = [
  { to:'/',          label:'Dashboard', emoji:'◈' },
  { to:'/schedule',  label:'Schedule',  emoji:'📅' },
  { to:'/finance',   label:'Finance',   emoji:'💰' },
  { to:'/nutrition', label:'Nutrition', emoji:'🍽' },
  { to:'/wellness',  label:'Wellness',  emoji:'🎯' },
  { to:'/workout',   label:'Workout',   emoji:'🏋️' },
  { to:'/journal',   label:'Journal',   emoji:'✍️' },
  { to:'/cycle',     label:'Cycle',     emoji:'🌸', pink:true },
  { to:'/settings',  label:'Settings',  emoji:'⚙️' },
]

function Wave() {
  return (
    <div style={{ position:'fixed', bottom:-10, left:'-10%', width:'120%', height:300, pointerEvents:'none', zIndex:1 }}>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv3 9s ease-in-out infinite', opacity:0.10 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#f5c842" stopOpacity="0"/>
            <stop offset="30%"  stopColor="#f7d060" stopOpacity="1"/>
            <stop offset="70%"  stopColor="#e8994a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#f5c842" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,180 C150,120 250,200 400,160 S650,80 800,140 S1050,200 1200,150 L1200,280 L0,280 Z" fill="url(#g3)"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv2 7s ease-in-out infinite', opacity:0.16 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#c9993a" stopOpacity="0"/>
            <stop offset="25%"  stopColor="#f5c842" stopOpacity="1"/>
            <stop offset="60%"  stopColor="#f7d060" stopOpacity="1"/>
            <stop offset="100%" stopColor="#e8994a" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,200 C100,150 200,240 350,180 S600,100 750,170 S1000,230 1200,170 L1200,280 L0,280 Z" fill="url(#g2)"/>
      </svg>
      <svg style={{ position:'absolute', bottom:0, left:0, width:'100%', height:'100%', animation:'wv1 5.5s ease-in-out infinite', opacity:0.26 }}
        viewBox="0 0 1200 280" preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#f5c842" stopOpacity="0"/>
            <stop offset="20%"  stopColor="#f5c842" stopOpacity="1"/>
            <stop offset="50%"  stopColor="#fae090" stopOpacity="1"/>
            <stop offset="80%"  stopColor="#e8994a" stopOpacity="1"/>
            <stop offset="100%" stopColor="#f5c842" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,220 C80,170 180,250 320,200 S550,120 700,190 S950,250 1200,195 L1200,280 L0,280 Z" fill="url(#g1)"/>
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
        @keyframes wv1 { 0%{transform:translateX(0) translateY(0) scaleY(1)} 25%{transform:translateX(-60px) translateY(8px) scaleY(1.04)} 50%{transform:translateX(-120px) translateY(0) scaleY(0.97)} 75%{transform:translateX(-60px) translateY(-8px) scaleY(1.03)} 100%{transform:translateX(0) translateY(0) scaleY(1)} }
        @keyframes wv2 { 0%{transform:translateX(0) scaleY(1)} 33%{transform:translateX(80px) translateY(-10px) scaleY(1.05)} 66%{transform:translateX(-40px) translateY(6px) scaleY(0.96)} 100%{transform:translateX(0) scaleY(1)} }
        @keyframes wv3 { 0%{transform:translateX(-40px) translateY(4px)} 50%{transform:translateX(40px) translateY(-4px)} 100%{transform:translateX(-40px) translateY(4px)} }
        @keyframes gp  { 0%,100%{opacity:0.6;transform:translateX(-50%) scale(1)} 50%{opacity:1;transform:translateX(-50%) scale(1.08)} }
        *{font-family:${F}!important;}
        .al{display:flex;height:100vh;overflow:hidden;background:#0e0f16;position:relative;}
        .sb{width:220px;flex-shrink:0;display:flex;flex-direction:column;padding:0 0 16px;background:#12131a;border-right:1px solid rgba(255,255,255,0.06);position:relative;z-index:2;}
        .nl{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;text-decoration:none;margin-bottom:2px;color:rgba(255,255,255,0.40);font-size:13px;font-weight:500;transition:all 0.18s;border:1px solid transparent;}
        .nl:hover{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.75);}
        .nl.act{background:rgba(245,200,66,0.12);border-color:rgba(245,200,66,0.22);color:#f5c842;font-weight:700;}
        .nl.acp{background:rgba(212,83,126,0.10);border-color:rgba(212,83,126,0.22);color:#ed93b1;font-weight:700;}
        .mc{flex:1;overflow:auto;padding:28px 30px;position:relative;z-index:2;}
        .mt{display:none;} .bn{display:none;}
        @media(max-width:640px){
          .al{flex-direction:column;height:100dvh;}
          .sb{display:none;}
          .mc{flex:1;overflow:auto;padding:14px 14px 84px;}
          .mt{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.06);background:#12131a;flex-shrink:0;position:relative;z-index:2;}
          .bn{display:flex;position:fixed;bottom:0;left:0;right:0;height:64px;background:rgba(14,15,22,0.92);border-top:1px solid rgba(255,255,255,0.07);z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);overflow-x:auto;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);}
          .bn a{flex:1;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:rgba(255,255,255,0.28);font-size:9px;font-weight:600;transition:color 0.15s;-webkit-tap-highlight-color:transparent;}
          .bn a.act{color:#f5c842;} .bn a.acp{color:#ed93b1;} .bn .bi{font-size:18px;line-height:1;}
        }
      `}</style>

      <div className="al">
        <Wave />

        <aside className="sb">
          <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#f5c842', letterSpacing:'0.04em' }}>FOLIO</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:3 }}>Digital Bullet Journal</div>
          </div>
          <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to==='/'}
                className={({ isActive }) => isActive ? (item.pink ? 'nl acp' : 'nl act') : 'nl'}>
                <span style={{ fontSize:16, lineHeight:1, width:20, textAlign:'center' }}>{item.emoji}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding:'10px 10px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.70)' }}>{profile?.full_name || user?.email?.split('@')[0] || 'My Account'}</div>
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
            <button onClick={handleSignOut} style={{ background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, color:'rgba(255,255,255,0.50)', fontSize:12, cursor:'pointer', padding:'5px 12px' }}>Sign out</button>
          </div>
        </div>

        <main className="mc"><Outlet /></main>

        <nav className="bn">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              className={({ isActive }) => isActive ? (item.pink ? 'acp' : 'act') : ''}>
              <span className="bi">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
