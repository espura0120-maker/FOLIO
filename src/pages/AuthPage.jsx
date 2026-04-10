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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Extra glow orbs for auth page */}
      <div style={{
        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(201,153,58,0.20) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'glowPulse 4s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', right: '10%',
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(201,153,58,0.10) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Diamond icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64,
              background: 'rgba(201,153,58,0.12)',
              border: '1px solid rgba(201,153,58,0.3)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(201,153,58,0.20)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <polygon points="16,3 28,13 16,29 4,13" fill="none" stroke="rgba(201,153,58,0.4)" strokeWidth="0.5"/>
                <polygon points="16,3 28,13 16,11" fill="#fad878" opacity="0.9"/>
                <polygon points="16,3 4,13 16,11" fill="#f0c96a" opacity="0.8"/>
                <polygon points="4,13 16,29 16,21" fill="#7a5a1a" opacity="0.9"/>
                <polygon points="28,13 16,29 16,21" fill="#9a7422" opacity="0.9"/>
                <polygon points="4,13 16,11 16,21" fill="#c9993a" opacity="0.95"/>
                <polygon points="28,13 16,11 16,21" fill="#e8b85a" opacity="0.95"/>
              </svg>
            </div>
          </div>

          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 38, color: '#e8b85a', letterSpacing: '0.06em', textShadow: '0 0 30px rgba(232,184,90,0.4)' }}>
            FOLIO
          </div>
          <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.35)', marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Digital Bullet Journal
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 24,
          padding: '28px 28px 24px',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 0 40px rgba(201,153,58,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 24, border: '1px solid rgba(255,255,255,0.07)' }}>
            {[['signin','Sign in'],['signup','Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '8px 10px', border: 'none',
                borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: mode === m ? 'rgba(201,153,58,0.18)' : 'transparent',
                color: mode === m ? '#e8b85a' : 'rgba(240,237,232,0.35)',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: mode === m ? '0 0 12px rgba(201,153,58,0.15)' : 'none',
                border: mode === m ? '1px solid rgba(201,153,58,0.25)' : '1px solid transparent',
              }}>{label}</button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Full name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', display: 'block', marginBottom: 6, letterSpacing: '0.04em' }}>Password</label>
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
              marginTop: 4, padding: '12px 16px',
              background: 'linear-gradient(135deg, #c9993a 0%, #e8b85a 100%)',
              border: '1px solid rgba(232,184,90,0.3)',
              borderRadius: 12, color: '#1a1200', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
              fontFamily: 'inherit', width: '100%',
              boxShadow: '0 0 24px rgba(201,153,58,0.30), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
              {loading ? '...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(240,237,232,0.20)', letterSpacing: '0.04em' }}>
          Your data is private and encrypted ✦
        </div>
      </div>
    </div>
  )
}
