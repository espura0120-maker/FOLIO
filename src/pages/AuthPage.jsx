import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm]       = useState({ email: '', password: '', fullName: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function friendlyError(msg) {
    if (!msg) return 'Something went wrong.'
    if (msg.includes('Invalid login') || msg.includes('invalid credentials')) return 'Wrong email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first.'
    if (msg.includes('already registered')) return 'An account with this email already exists.'
    if (msg.includes('Password')) return 'Password must be at least 6 characters.'
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
    } catch (err) {
      setError(friendlyError(err.message))
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: '#0e0f16',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif', fontSize: 38, fontWeight: 800, color: '#f5c842', letterSpacing: '0.04em', marginBottom: 6 }}>
            FOLIO
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Digital Bullet Journal
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#1c1e2b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 22, padding: '28px 26px 24px' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#262838', borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[['signin','Sign in'],['signup','Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '8px 10px', fontFamily: 'inherit',
                borderRadius: 9, fontSize: 13, fontWeight: 600,
                background: mode === m ? '#f5c842' : 'transparent',
                border: 'none',
                color: mode === m ? '#1a1400' : 'rgba(255,255,255,0.35)',
                cursor: 'pointer', transition: 'all 0.18s',
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>Full name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required style={{ paddingRight: 42 }} />
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '0.03em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} style={{ paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: -6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', textDecoration: 'underline', cursor: 'pointer' }}>Forgot password?</span>
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(232,98,74,0.10)', color: '#f07a62', border: '1px solid rgba(232,98,74,0.20)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(61,184,138,0.10)', color: '#5dd4a6', border: '1px solid rgba(61,184,138,0.20)' }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 6, padding: '13px 16px', fontFamily: 'inherit',
              background: '#f5c842', border: 'none', borderRadius: 12,
              color: '#1a1400', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, width: '100%',
              transition: 'opacity 0.2s, transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.transform = 'scale(1.01)' }}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>
          Your data is private and encrypted ✦
        </div>
      </div>
    </div>
  )
}
