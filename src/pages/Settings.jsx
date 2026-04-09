import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, Button, SectionHeader, Grid } from '@/components/shared/UI'

export default function Settings() {
  const { user, profile, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name:   '',
    cal_goal:    2000,
    weight_unit: 'lbs',
    currency:    'EUR',
  })
  const [saved, setSaved] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (profile) {
      setForm({
        full_name:   profile.full_name   || '',
        cal_goal:    profile.cal_goal    || 2000,
        weight_unit: profile.weight_unit || 'lbs',
        currency:    profile.currency    || 'EUR',
      })
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    await updateProfile(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', JPY: '¥' }
  const curr = form.currency || 'EUR'

  return (
    <div className="fade-up">
      <SectionHeader title="Settings" sub="Preferences & account" />

      <Grid cols={2}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardTitle>Profile</CardTitle>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Full name</label>
                <input value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Email</label>
                <input value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
              </div>
              <Button type="submit" variant="gold">{saved ? '✓ Saved!' : 'Save Profile'}</Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Preferences</CardTitle>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Currency */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>Currency</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['EUR','€ Euro'],['USD','$ Dollar'],['JPY','¥ Yen']].map(([code, label]) => (
                    <button key={code} type="button" onClick={() => setForm(f => ({ ...f, currency: code }))} style={{
                      flex: 1, padding: '10px 6px', border: `1px solid ${form.currency === code ? 'var(--gold)' : 'var(--border2)'}`,
                      borderRadius: 'var(--radius-sm)', background: form.currency === code ? 'rgba(201,153,58,0.12)' : 'var(--bg3)',
                      color: form.currency === code ? 'var(--gold2)' : 'var(--text2)',
                      fontSize: 13, fontWeight: form.currency === code ? 500 : 400,
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                      <span style={{ fontSize: 20 }}>{code === 'EUR' ? '€' : code === 'USD' ? '$' : '¥'}</span>
                      <span>{label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Currently: <span style={{ color: 'var(--gold2)', fontFamily: 'JetBrains Mono, monospace' }}>{CURRENCY_SYMBOLS[curr]} {curr}</span>
                </div>
              </div>

              {/* Weight unit */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>Weight unit</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['kg','Kilograms'],['lbs','Pounds']].map(([unit, label]) => (
                    <button key={unit} type="button" onClick={() => setForm(f => ({ ...f, weight_unit: unit }))} style={{
                      flex: 1, padding: '10px 6px', border: `1px solid ${form.weight_unit === unit ? 'var(--teal)' : 'var(--border2)'}`,
                      borderRadius: 'var(--radius-sm)', background: form.weight_unit === unit ? 'rgba(61,184,138,0.12)' : 'var(--bg3)',
                      color: form.weight_unit === unit ? 'var(--teal2)' : 'var(--text2)',
                      fontSize: 13, fontWeight: form.weight_unit === unit ? 500 : 400,
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    }}>
                      <span style={{ fontSize: 16, fontFamily: 'JetBrains Mono, monospace' }}>{unit}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Currently: <span style={{ color: 'var(--teal2)', fontFamily: 'JetBrains Mono, monospace' }}>{form.weight_unit}</span>
                </div>
              </div>

              {/* Calorie goal */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Daily calorie goal</label>
                <input type="number" value={form.cal_goal} onChange={set('cal_goal')} min={500} max={9000} />
              </div>

              <Button type="submit" variant="gold">{saved ? '✓ Saved!' : 'Save Preferences'}</Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardTitle>Account</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 4 }}>
              Signed in as <strong style={{ color: 'var(--text)' }}>{user?.email}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Your data is private and only visible to you — secured by Supabase Row Level Security.
            </p>
          </Card>

          <Card>
            <CardTitle>About Folio</CardTitle>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--gold2)', marginBottom: 8 }}>FOLIO v1.0</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Your all-in-one digital bullet journal — finances, nutrition, wellness, workouts & daily reflection.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
              Hosted on GitHub Pages · Powered by Supabase
            </p>
          </Card>
        </div>
      </Grid>
    </div>
  )
}
