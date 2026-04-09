import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]     = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]     = useState({ email: '', password: '', fullName: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function friendlyError(msg) {
    if (!msg) return 'Something went wrong.'
    if (msg.includes('Invalid login') || msg.includes('invalid credentials')) return 'Wrong email or password.'
    if (msg.includes('Email not confirmed')) return 'Please confirm your email first — check your inbox.'
    if (msg.includes('already registered')) return 'An account with this email already exists. Try signing in.'
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
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 42, color: 'var(--gold2)', letterSpacing: '0.02em' }}>
            FOLIO
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
            Your digital bullet journal
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px' }}>

          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 24 }}>
            {[['signin','Sign in'],['signup','Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{
                flex: 1, padding: '7px 8px', border: 'none',
                borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500,
                background: mode === m ? 'var(--bg4)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text3)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {mode === 'signup' && (
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Full name</label>
                <input value={form.fullName} onChange={set('fullName')} placeholder="Your name" required />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'rgba(217,100,74,0.1)', color: 'var(--coral2)', border: '1px solid rgba(217,100,74,0.2)' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, background: 'rgba(61,184,138,0.1)', color: 'var(--teal2)', border: '1px solid rgba(61,184,138,0.2)' }}>
                {success}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '11px 16px', background: 'var(--gold)', border: 'none',
              borderRadius: 'var(--radius-sm)', color: '#1a1200', fontSize: 14,
              fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'all 0.15s', marginTop: 4,
              fontFamily: 'inherit', width: '100%',
            }}>
              {loading ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text3)' }}>
          Your data is private and encrypted ✦
        </div>
      </div>
    </div>
  )
}
