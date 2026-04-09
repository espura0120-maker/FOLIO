import { useState } from 'react'
import { useProfile } from '@/hooks/useData'
import { Card, CardTitle, Button, SectionHeader, Grid } from '@/components/shared/UI'

export default function Settings() {
  const { profile, update } = useProfile()
  const [form, setForm] = useState({
    full_name:   profile?.full_name   || '',
    cal_goal:    profile?.cal_goal    || 2000,
    weight_unit: profile?.weight_unit || 'lbs',
    currency:    profile?.currency    || 'USD',
  })
  const [saved, setSaved] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave(e) {
    e.preventDefault()
    update(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Settings" sub="Preferences & account" />

      <Grid cols={2}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardTitle>Profile</CardTitle>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Your name</label>
                <input value={form.full_name} onChange={set('full_name')} placeholder="e.g. Alex Johnson" />
              </div>
              <Button type="submit" variant="gold">{saved ? '✓ Saved!' : 'Save Profile'}</Button>
            </form>
          </Card>

          <Card>
            <CardTitle>Preferences</CardTitle>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Daily calorie goal</label>
                <input type="number" value={form.cal_goal} onChange={set('cal_goal')} min={500} max={9000} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Weight unit</label>
                <select value={form.weight_unit} onChange={set('weight_unit')}>
                  <option value="lbs">Pounds (lbs)</option>
                  <option value="kg">Kilograms (kg)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Currency</label>
                <select value={form.currency} onChange={set('currency')}>
                  {['USD','EUR','GBP','CAD','AUD','JPY','CHF'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Button type="submit" variant="gold">{saved ? '✓ Saved!' : 'Save Preferences'}</Button>
            </form>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <CardTitle>Data Storage</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Your data is stored in <strong style={{ color: 'var(--teal2)' }}>Supabase</strong> — a cloud database. It saves automatically and is accessible from any device or browser.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginTop: 10 }}>
              You can view and manage your data directly at <span style={{ color: 'var(--gold2)', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>supabase.com</span> → your project → Table Editor.
            </p>
          </Card>

          <Card>
            <CardTitle>About Folio</CardTitle>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--gold2)', marginBottom: 8 }}>FOLIO v1.0</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Your all-in-one digital bullet journal — finances, nutrition, wellness, workouts & daily reflection.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, lineHeight: 1.6 }}>
              Hosted on GitHub Pages · Powered by Supabase
            </p>
          </Card>
        </div>
      </Grid>
    </div>
  )
}
