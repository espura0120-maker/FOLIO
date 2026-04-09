import { useState, useRef } from 'react'
import { useProfile } from '@/hooks/useData'
import { exportData, importData } from '@/lib/store'
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
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave(e) {
    e.preventDefault()
    update(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const ok = importData(ev.target.result)
      setImportMsg(ok ? '✓ Data imported — refresh the page to see it.' : '✕ Invalid file. Make sure you pick a Folio backup .json file.')
      setTimeout(() => setImportMsg(''), 4000)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Settings" sub="Preferences, backup & restore" />

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
            <CardTitle>Backup & Restore</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>
              Your data lives in your browser's localStorage. Export a backup regularly — especially before clearing browser data or switching devices.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="default" fullWidth onClick={exportData}>
                ↓ Export backup (.json)
              </Button>

              <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
              <Button variant="default" fullWidth onClick={() => fileRef.current.click()}>
                ↑ Import backup (.json)
              </Button>

              {importMsg && (
                <div style={{
                  padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13,
                  background: importMsg.startsWith('✓') ? 'rgba(61,184,138,0.1)' : 'rgba(217,100,74,0.1)',
                  color: importMsg.startsWith('✓') ? 'var(--teal2)' : 'var(--coral2)',
                  border: `1px solid ${importMsg.startsWith('✓') ? 'rgba(61,184,138,0.2)' : 'rgba(217,100,74,0.2)'}`,
                }}>
                  {importMsg}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>AI Food Analysis</CardTitle>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 14 }}>
              The photo analyzer uses the Anthropic API. To enable it, add your API key as a GitHub Actions secret named <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--coral2)', background: 'var(--bg4)', padding: '1px 5px', borderRadius: 3 }}>VITE_ANTHROPIC_API_KEY</code>.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
              Get a key at console.anthropic.com → API Keys. The free tier includes enough credits for personal use.
            </p>
          </Card>

          <Card>
            <CardTitle>About Folio</CardTitle>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--gold2)', marginBottom: 8 }}>FOLIO v1.0</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              Your all-in-one digital bullet journal — finances, nutrition, wellness, workouts & daily reflection. Hosted on GitHub Pages, zero backend required.
            </p>
          </Card>
        </div>
      </Grid>
    </div>
  )
}
