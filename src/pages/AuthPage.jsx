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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Extra glow orb centered on auth page */}
      <div style={{
        position: 'fixed', top: '8%', left: '50%', transform: 'translateX(-50%)',
        width: 520, height: 520,
        background: 'radial-gradient(circle, rgba(218,155,38,0.32) 0%, rgba(200,130,20,0.12) 42%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        animation: 'glowPulse 5s ease-in-out infinite',
        filter: 'blur(2px)',
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          {/* Diamond */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{
              width: 68, height: 68,
              background: 'rgba(201,153,58,0.10)',
              border: '1px solid rgba(201,153,58,0.28)',
              borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 32px rgba(201,153,58,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              animation: 'glowPulse 4s ease-in-out infinite',
            }}>
              <svg width="34" height="34" viewBox="0 0 32 32">
                <polygon points="16,3 28,13 16,29 4,13" fill="none" stroke="rgba(201,153,58,0.35)" strokeWidth="0.5"/>
                <polygon points="16,3 28,13 16,11" fill="#fad878" opacity="0.92"/>
                <polygon points="16,3 4,13 16,11"  fill="#f0c96a" opacity="0.82"/>
                <polygon points="4,13 16,29 16,21"  fill="#7a5a1a" opacity="0.92"/>
                <polygon points="28,13 16,29 16,21" fill="#9a7422" opacity="0.92"/>
                <polygon points="4,13 16,11 16,21"  fill="#c9993a" opacity="0.97"/>
                <polygon points="28,13 16,11 16,21" fill="#e8b85a" opacity="0.97"/>
              </svg>
            </div>
          </div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 40, color: '#e8b84a', letterSpacing: '0.06em', textShadow: '0 0 28px rgba(232,184,74,0.52), 0 0 60px rgba(232,184,74,0.18)' }}>
            FOLIO
          </div>
          <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.30)', marginTop: 6, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
            Digital Bullet Journal
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.048)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 24,
          padding: '28px 26px 24px',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          boxShadow: '0 0 48px rgba(201,153,58,0.09), inset 0 1px 0 rgba(255,255,255,0.07)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* shimmer on top edge */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(220,160,40,0.50) 50%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
            {[['signin','Sign in'],['signup','Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '8px 10px', fontFamily: 'inherit',
                borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: mode === m ? 'rgba(201,153,58,0.16)' : 'transparent',
                border: mode === m ? '1px solid rgba(201,153,58,0.28)' : '1px solid transparent',
                color: mode === m ? '#e8b84a' : 'rgba(240,232,216,0.32)',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: mode === m ? '0 0 14px rgba(201,153,58,0.14)' : 'none',
                textShadow: mode === m ? '0 0 10px rgba(232,184,74,0.40)' : 'none',
              }}>{label}</button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Full name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(217,100,74,0.10)', color: '#f07a5e', border: '1px solid rgba(217,100,74,0.20)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: 'rgba(61,184,138,0.10)', color: '#5dd4a6', border: '1px solid rgba(61,184,138,0.20)' }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop: 4, padding: '12px 16px', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #b8852a 0%, #e8b84a 50%, #c9993a 100%)',
              border: '1px solid rgba(232,184,74,0.28)',
              borderRadius: 12, color: '#1a1000', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: '100%',
              boxShadow: '0 0 26px rgba(201,153,58,0.38), 0 0 52px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.22)',
              textShadow: 'none',
            }}>
              {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 12, color: 'rgba(240,232,216,0.18)', letterSpacing: '0.05em' }}>
          Your data is private and encrypted ✦
        </div>
      </div>
    </div>
  )
}
