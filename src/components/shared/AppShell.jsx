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

export default function AppShell() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <>
      <style>{`
        * { font-family: ${F} !important; }
        .app-layout { display:flex; height:100vh; overflow:hidden; background:#0e0f16; font-family:${F}; }
        .sidebar {
          width:220px; flex-shrink:0; display:flex; flex-direction:column; padding:0 0 16px;
          background:#12131a; border-right:1px solid rgba(255,255,255,0.06);
        }
        .nl {
          display:flex; align-items:center; gap:10px;
          padding:10px 14px; border-radius:12px;
          text-decoration:none; margin-bottom:2px;
          color:rgba(255,255,255,0.40); font-size:13px; font-weight:500;
          transition:all 0.18s; border:1px solid transparent;
          font-family:${F};
        }
        .nl:hover { background:#1c1e2b; color:rgba(255,255,255,0.75); }
        .nl.act  { background:#1c1e2b; border-color:rgba(245,200,66,0.20); color:#f5c842; font-weight:700; }
        .nl.act-p{ background:#1c1e2b; border-color:rgba(212,83,126,0.22); color:#ed93b1; font-weight:700; }
        .nl .dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,0.14); flex-shrink:0; transition:all 0.18s; }
        .nl.act  .dot { background:#f5c842; box-shadow:0 0 6px #f5c842; }
        .nl.act-p .dot { background:#ed93b1; box-shadow:0 0 6px #ed93b1; }
        .nl .ico { font-size:16px; line-height:1; width:20px; text-align:center; }
        .main { flex:1; overflow:auto; padding:28px 30px; font-family:${F}; }
        .mob-top { display:none; }
        .bot-nav  { display:none; }
        @media(max-width:640px){
          .app-layout{flex-direction:column;height:100dvh;}
          .sidebar{display:none;}
          .main{flex:1;overflow:auto;padding:14px 14px 84px;}
          .mob-top{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.06);background:#12131a;flex-shrink:0;}
          .bot-nav{display:flex;position:fixed;bottom:0;left:0;right:0;height:64px;background:#12131a;border-top:1px solid rgba(255,255,255,0.07);z-index:100;padding-bottom:env(safe-area-inset-bottom,0px);overflow-x:auto;}
          .bot-nav a{flex:1;min-width:44px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:rgba(255,255,255,0.28);font-size:9px;font-weight:600;transition:color 0.15s;-webkit-tap-highlight-color:transparent;font-family:${F};}
          .bot-nav a.act{color:#f5c842;}
          .bot-nav a.act-p{color:#ed93b1;}
          .bot-nav .bi{font-size:18px;line-height:1;}
        }
      `}</style>

      <div className="app-layout">
        <aside className="sidebar">
          <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily:F, fontSize:22, fontWeight:800, color:'#f5c842', letterSpacing:'0.04em' }}>FOLIO</div>
            <div style={{ fontFamily:F, fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:3 }}>Digital Bullet Journal</div>
          </div>

          <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to==='/'}
                className={({ isActive }) => isActive ? (item.pink ? 'nl act-p' : 'nl act') : 'nl'}
              >
                <span className="ico">{item.emoji}</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div style={{ padding:'10px 10px 0', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 14px' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, fontFamily:F }}>
                {initials}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:F, fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.70)' }}>
                  {profile?.full_name || user?.email?.split('@')[0] || 'My Account'}
                </div>
                <button onClick={handleSignOut} style={{ fontFamily:F, background:'none', border:'none', color:'rgba(255,255,255,0.30)', fontSize:11, cursor:'pointer', padding:0 }}
                  onMouseEnter={e=>e.target.style.color='#f07a62'}
                  onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.30)'}>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="mob-top">
          <div style={{ fontFamily:F, fontSize:18, fontWeight:800, color:'#f5c842' }}>FOLIO</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', color:'#f5c842', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{initials}</div>
            <button onClick={handleSignOut} style={{ fontFamily:F, background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, color:'rgba(255,255,255,0.50)', fontSize:12, cursor:'pointer', padding:'5px 12px' }}>Sign out</button>
          </div>
        </div>

        <main className="main"><Outlet /></main>

        <nav className="bot-nav">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to==='/'}
              className={({ isActive }) => isActive ? (item.pink ? 'act-p' : 'act') : ''}
            >
              <span className="bi">{item.emoji}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  )
}
