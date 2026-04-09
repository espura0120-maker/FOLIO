import { useState, useRef } from 'react'
import { useFoodLogs, useProfile } from '@/hooks/useData'
import { Card, CardTitle, StatCard, Grid, Button, ListItem, EmptyState, SectionHeader, Spinner } from '@/components/shared/UI'

const MEALS = ['breakfast','lunch','dinner','snack']
const MEAL_ICON = { breakfast:'🌅', lunch:'☀️', dinner:'🌙', snack:'🍎' }

export default function Nutrition() {
  const { profile, update: updateProfile } = useProfile()
  const { logs, todayLogs, add, remove, totalCalories, totalProtein, calGoal } = useFoodLogs()
  const [form, setForm] = useState({ name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', meal: 'lunch' })
  const [saving, setSaving] = useState(false)
  const [ai, setAi] = useState({ loading: false, result: null, error: null })
  const fileRef = useRef()
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const pct = Math.min((totalCalories / calGoal) * 100, 100)

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    add({ ...form, calories: +form.calories || 0, protein_g: +form.protein_g || 0, carbs_g: +form.carbs_g || 0, fat_g: +form.fat_g || 0 })
    setForm(f => ({ ...f, name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' }))
    setSaving(false)
  }

  async function analyzeImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setAi({ loading: true, result: null, error: null })
    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1]
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) {
        setAi({ loading: false, result: null, error: 'Add VITE_ANTHROPIC_API_KEY to your .env file to use AI analysis.' })
        return
      }
      try {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 500,
            messages: [{ role: 'user', content: [
              { type: 'image', source: { type: 'base64', media_type: file.type, data: base64 } },
              { type: 'text', text: 'Analyze this food. Respond ONLY in JSON: {"food":"name","calories":number,"protein":number,"carbs":number,"fat":number,"notes":"one sentence"}. No markdown, no extra text.' }
            ]}]
          })
        })
        const data = await resp.json()
        const text = data.content?.map(c => c.text || '').join('') || ''
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
        setAi({ loading: false, result: parsed, error: null })
      } catch {
        setAi({ loading: false, result: null, error: 'Could not analyze image. Check your API key and try again.' })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function logAiResult() {
    add({ name: ai.result.food, calories: ai.result.calories, protein_g: ai.result.protein, carbs_g: ai.result.carbs || 0, fat_g: ai.result.fat || 0, meal: form.meal, ai_analyzed: true })
    setAi({ loading: false, result: null, error: null })
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Nutrition" sub="Log meals & analyze with AI" />

      <Grid cols={3} style={{ marginBottom: 16 }}>
        <StatCard label="Calories Today" value={totalCalories} color="var(--coral2)" sub={`of ${calGoal} kcal`} accent={pct} />
        <StatCard label="Protein Today"  value={`${totalProtein.toFixed(1)}g`} color="var(--blue2)" />
        <div style={{ background: 'var(--bg3)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Calorie Goal</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" defaultValue={calGoal} id="cal-goal-input" min={500} max={9000} style={{ padding: '7px 10px', fontSize: 13 }} />
            <Button size="sm" onClick={() => { const v = parseInt(document.getElementById('cal-goal-input').value); if (v > 0) updateProfile({ cal_goal: v }) }}>Set</Button>
          </div>
        </div>
      </Grid>

      <Grid cols={2} style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Manual Entry</CardTitle>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <input value={form.name} onChange={set('name')} placeholder="Food name" required />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={form.calories}  onChange={set('calories')}  placeholder="Calories"    min={0} />
              <input type="number" value={form.protein_g} onChange={set('protein_g')} placeholder="Protein (g)" min={0} step="0.1" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={form.carbs_g}  onChange={set('carbs_g')}  placeholder="Carbs (g)"  min={0} step="0.1" />
              <input type="number" value={form.fat_g}    onChange={set('fat_g')}    placeholder="Fat (g)"    min={0} step="0.1" />
            </div>
            <select value={form.meal} onChange={set('meal')}>{MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</select>
            <Button type="submit" variant="gold" loading={saving}>+ Log Food</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>AI Photo Analyzer</CardTitle>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={analyzeImage} />
          {!ai.loading && !ai.result && (
            <div onClick={() => fileRef.current.click()}
              style={{ border: '1.5px dashed var(--border2)', borderRadius: 'var(--radius)', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 4 }}>Upload a food photo</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI estimates calories, protein, carbs & fat</div>
            </div>
          )}
          {ai.loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 20px' }}>
              <Spinner size={28} color="var(--teal)" />
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Analyzing photo...</div>
            </div>
          )}
          {ai.error && (
            <div style={{ padding: 12, background: 'rgba(217,100,74,0.1)', border: '1px solid rgba(217,100,74,0.2)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--coral2)' }}>{ai.error}</div>
          )}
          {ai.result && (
            <div style={{ background: 'rgba(61,184,138,0.08)', border: '1px solid rgba(61,184,138,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: 'var(--teal)', marginBottom: 8 }}>✦ AI ANALYSIS</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>{ai.result.food}</div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 8, flexWrap: 'wrap' }}>
                {[['Calories','var(--coral2)',ai.result.calories],['Protein','var(--blue2)',`${ai.result.protein}g`],['Carbs','var(--gold2)',`${ai.result.carbs||0}g`],['Fat','var(--purple2)',`${ai.result.fat||0}g`]].map(([l,c,v]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: c }}>{v}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{l}</div>
                  </div>
                ))}
              </div>
              {ai.result.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{ai.result.notes}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.meal} onChange={set('meal')} style={{ fontSize: 12, padding: '6px 8px' }}>{MEALS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}</select>
                <Button size="sm" variant="teal" onClick={logAiResult} style={{ flex: 1 }}>+ Add to Log</Button>
                <Button size="sm" onClick={() => setAi({ loading: false, result: null, error: null })}>✕</Button>
              </div>
            </div>
          )}
        </Card>
      </Grid>

      <Card>
        <CardTitle>Today's Log</CardTitle>
        {todayLogs.length === 0
          ? <EmptyState icon="🍽" message="Nothing logged today." />
          : MEALS.map(meal => {
            const mFoods = todayLogs.filter(f => f.meal === meal)
            if (!mFoods.length) return null
            return (
              <div key={meal} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', margin: '10px 0 6px' }}>{MEAL_ICON[meal]} {meal}</div>
                {mFoods.map(f => (
                  <ListItem key={f.id} icon={f.ai_analyzed ? '🤖' : '🍽'} iconBg="rgba(217,100,74,0.12)"
                    name={f.name} sub={`P: ${f.protein_g||0}g · C: ${f.carbs_g||0}g · F: ${f.fat_g||0}g${f.ai_analyzed?' · AI':''}`}
                    right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--coral2)' }}>{f.calories} kcal</span>}
                    onDelete={() => remove(f.id)} />
                ))}
              </div>
            )
          })
        }
      </Card>
    </div>
  )
}
