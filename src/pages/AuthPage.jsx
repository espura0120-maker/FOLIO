import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

const F = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]       = useState({ email:'', password:'', fullName:'' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function friendlyError(msg) {
    if (!msg) return 'Something went wrong.'
    if (msg.includes('Invalid login') || msg.includes('invalid credentials')) return 'Wrong email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
    if (msg.includes('already registered')) return 'An account with this email already exists.'
    return msg
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
        navigate('/')
      } else {
        const { error } = await signUp(form.email, form.password, form.fullName)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
      }
    } catch (err) { setError(friendlyError(err.message)) }
    setLoading(false)
  }

  const input = {
    background:'#222435', border:'1px solid rgba(255,255,255,0.10)',
    borderRadius:12, color:'#fff', fontFamily:F,
    fontSize:14, padding:'12px 14px', width:'100%', outline:'none',
    transition:'border-color 0.18s',
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'#0e0f16', fontFamily:F }}>
      <div style={{ width:'100%', maxWidth:400 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:F, fontSize:42, fontWeight:800, color:'#f5c842', letterSpacing:'0.06em', marginBottom:6 }}>FOLIO</div>
          <div style={{ fontFamily:F, fontSize:12, color:'rgba(255,255,255,0.28)', letterSpacing:'0.10em', textTransform:'uppercase' }}>Digital Bullet Journal</div>
        </div>

        {/* Card */}
        <div style={{ background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, padding:'28px 24px 24px', fontFamily:F }}>

          {/* Title */}
          <div style={{ fontFamily:F, fontSize:24, fontWeight:800, color:'#fff', marginBottom:22 }}>
            {mode === 'signin' ? 'Login' : 'Create Account'}
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {mode === 'signup' && (
              <div>
                <div style={{ position:'relative' }}>
                  <input value={form.fullName} onChange={set('fullName')} placeholder="Full name" required
                    style={{ ...input, paddingRight:44 }}
                    onFocus={e=>e.target.style.borderColor='rgba(245,200,66,0.45)'}
                    onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}
                  />
                </div>
              </div>
            )}

            <div style={{ position:'relative' }}>
              <input type="email" value={form.email} onChange={set('email')} placeholder="Email address" required
                style={{ ...input, paddingRight:44 }}
                onFocus={e=>e.target.style.borderColor='rgba(245,200,66,0.45)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}
              />
              <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
            </div>

            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} value={form.password} onChange={set('password')} placeholder="Password" required minLength={6}
                style={{ ...input, paddingRight:44 }}
                onFocus={e=>e.target.style.borderColor='rgba(245,200,66,0.45)'}
                onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.10)'}
              />
              <button type="button" onClick={()=>setShowPass(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2, color:'rgba(255,255,255,0.28)', display:'flex', alignItems:'center' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPass
                    ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                  }
                </svg>
              </button>
            </div>

            {mode === 'signin' && (
              <div style={{ textAlign:'right', marginTop:-6 }}>
                <span style={{ fontFamily:F, fontSize:12, color:'rgba(255,255,255,0.32)', textDecoration:'underline', cursor:'pointer' }}>Forget Password?</span>
              </div>
            )}

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, fontFamily:F, background:'rgba(232,98,74,0.10)', color:'#f07a62', border:'1px solid rgba(232,98,74,0.20)' }}>{error}</div>
            )}
            {success && (
              <div style={{ padding:'10px 14px', borderRadius:10, fontSize:13, fontFamily:F, background:'rgba(61,184,138,0.10)', color:'#5dd4a6', border:'1px solid rgba(61,184,138,0.20)' }}>{success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop:8, padding:'14px 16px', fontFamily:F,
              background:'#f5c842', border:'none', borderRadius:99,
              color:'#1a1400', fontSize:16, fontWeight:700,
              cursor:loading?'not-allowed':'pointer',
              opacity:loading?0.7:1, width:'100%',
              transition:'transform 0.15s, opacity 0.2s',
            }}
            onMouseEnter={e=>{ if(!loading) e.target.style.transform='scale(1.01)' }}
            onMouseLeave={e=>e.target.style.transform='scale(1)'}
            >
              {loading ? '...' : mode==='signin' ? 'Sign In' : 'Sign Up'}
            </button>

            <div style={{ textAlign:'center', marginTop:4 }}>
              <span style={{ fontFamily:F, fontSize:13, color:'rgba(255,255,255,0.32)' }}>
                {mode==='signin' ? "Don't have an account? " : "Already have an account? "}
              </span>
              <span onClick={()=>{ setMode(mode==='signin'?'signup':'signin'); setError(''); setSuccess('') }}
                style={{ fontFamily:F, fontSize:13, color:'#f5c842', fontWeight:700, cursor:'pointer' }}>
                {mode==='signin' ? 'Sign Up' : 'Sign In'}
              </span>
            </div>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, fontFamily:F, fontSize:12, color:'rgba(255,255,255,0.18)' }}>
          Your data is private and encrypted ✦
        </div>
      </div>
    </div>
  )
}
