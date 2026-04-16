import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FS = "'DM Serif Display',Georgia,serif"

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate  = useNavigate()
  const [mode, setMode]     = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ email:'', password:'', fullName:'' })
  const set = k => e => setForm(f=>({...f,[k]:e.target.value}))

  function friendly(msg) {
    if (!msg) return 'Something went wrong.'
    if (msg.includes('Invalid login')||msg.includes('invalid credentials')) return 'Wrong email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
    if (msg.includes('already registered')) return 'An account with this email already exists.'
    return msg
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode==='signin') { const {error}=await signIn(form.email,form.password); if(error)throw error; navigate('/') }
      else { const {error}=await signUp(form.email,form.password,form.fullName); if(error)throw error; setSuccess('Account created! Check your email to confirm, then sign in.'); setMode('signin') }
    } catch(err) { setError(friendly(err.message)) }
    setLoading(false)
  }

  const inp = { background:'#222435', border:'1px solid rgba(255,255,255,0.10)', borderRadius:12, color:'#fff', fontFamily:F, fontSize:14, padding:'12px 14px', width:'100%', outline:'none', transition:'border-color 0.18s, box-shadow 0.18s' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'#0e0f16', fontFamily:F, position:'relative', overflow:'hidden' }}>
      {/* Background glows */}
      <div style={{ position:'fixed', top:-140, left:'50%', transform:'translateX(-50%)', width:600, height:600, background:'radial-gradient(circle,rgba(245,200,66,0.14) 0%,rgba(245,200,66,0.05) 45%,transparent 70%)', borderRadius:'50%', pointerEvents:'none', animation:'gp 7s ease-in-out infinite' }} />
      <div style={{ position:'fixed', bottom:-80, right:-80, width:350, height:350, background:'radial-gradient(circle,rgba(245,200,66,0.08) 0%,transparent 65%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:400, position:'relative', zIndex:1, animation:'scaleIn 0.35s cubic-bezier(0.34,1.4,0.64,1) both' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:38 }}>
          <div style={{ fontFamily:FS, fontSize:48, color:'#f5c842', letterSpacing:'0.02em', lineHeight:1, marginBottom:6, filter:'drop-shadow(0 0 24px rgba(245,200,66,0.40))' }}>Folio</div>
          <div style={{ fontFamily:F, fontSize:12, color:'rgba(255,255,255,0.26)', letterSpacing:'0.10em', textTransform:'uppercase' }}>Digital Bullet Journal</div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.052)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:24, padding:'28px 24px 24px', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', boxShadow:'0 24px 60px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          {/* Top gold line */}
          <div style={{ position:'absolute', top:0, left:'20%', right:'20%', height:1, background:'linear-gradient(90deg,transparent,rgba(245,200,66,0.50),transparent)', borderRadius:99 }} />

          {/* Mode toggle */}
          <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:3, gap:2, marginBottom:24 }}>
            {[['signin','Sign in'],['signup','Create account']].map(([m,l]) => (
              <button key={m} onClick={()=>{setMode(m);setError('');setSuccess('')}} style={{ flex:1, padding:'8px 10px', fontFamily:F, borderRadius:9, fontSize:13, fontWeight:700, background:mode===m?'#f5c842':'transparent', border:'none', color:mode===m?'#1a1400':'rgba(255,255,255,0.35)', cursor:'pointer', transition:'all 0.18s' }}>{l}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode==='signup' && (
              <div>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:6, fontWeight:700, letterSpacing:'0.03em' }}>Full name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required style={inp}
                  onFocus={e=>{e.target.style.borderColor='rgba(245,200,66,0.45)';e.target.style.boxShadow='0 0 0 3px rgba(245,200,66,0.07)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.10)';e.target.style.boxShadow='none'}} />
              </div>
            )}
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:6, fontWeight:700, letterSpacing:'0.03em' }}>Email</label>
              <div style={{ position:'relative' }}>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required style={{...inp,paddingRight:42}}
                  onFocus={e=>{e.target.style.borderColor='rgba(245,200,66,0.45)';e.target.style.boxShadow='0 0 0 3px rgba(245,200,66,0.07)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.10)';e.target.style.boxShadow='none'}} />
                <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:6, fontWeight:700, letterSpacing:'0.03em' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass?'text':'password'} value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} style={{...inp,paddingRight:42}}
                  onFocus={e=>{e.target.style.borderColor='rgba(245,200,66,0.45)';e.target.style.boxShadow='0 0 0 3px rgba(245,200,66,0.07)'}}
                  onBlur={e=>{e.target.style.borderColor='rgba(255,255,255,0.10)';e.target.style.boxShadow='none'}} />
                <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.26)', display:'flex', alignItems:'center', padding:2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass?<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>
            {mode==='signin' && <div style={{ textAlign:'right', marginTop:-6 }}><span style={{ fontSize:12, color:'rgba(255,255,255,0.30)', textDecoration:'underline', cursor:'pointer' }}>Forgot password?</span></div>}
            {error   && <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, background:'rgba(232,98,74,0.10)', color:'#f07a62', border:'1px solid rgba(232,98,74,0.20)', animation:'fadeIn 0.2s ease' }}>{error}</div>}
            {success && <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, background:'rgba(61,184,138,0.10)', color:'#5dd4a6', border:'1px solid rgba(61,184,138,0.20)', animation:'fadeIn 0.2s ease' }}>{success}</div>}

            <button type="submit" disabled={loading} style={{ marginTop:8, padding:'14px', fontFamily:F, background:'#f5c842', border:'none', borderRadius:99, color:'#1a1400', fontSize:15, fontWeight:800, cursor:loading?'not-allowed':'pointer', opacity:loading?0.65:1, width:'100%', letterSpacing:'0.01em', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e=>{if(!loading){e.target.style.transform='scale(1.01)';e.target.style.boxShadow='0 0 20px rgba(245,200,66,0.40)'}}}
              onMouseLeave={e=>{e.target.style.transform='scale(1)';e.target.style.boxShadow='none'}}>
              {loading?'…':mode==='signin'?'Sign In':'Create Account'}
            </button>

            <div style={{ textAlign:'center', marginTop:4 }}>
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.30)' }}>{mode==='signin'?"Don't have an account? ":"Already have an account? "}</span>
              <span onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('');setSuccess('')}} style={{ fontSize:13, color:'#f5c842', fontWeight:700, cursor:'pointer' }}>
                {mode==='signin'?'Sign up':'Sign in'}
              </span>
            </div>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontSize:12, color:'rgba(255,255,255,0.16)', fontFamily:F }}>Your data is private and encrypted ✦</div>
      </div>
    </div>
  )
}
