import { useState } from 'react'
import { useWellness } from '@/hooks/useData'
import { Card, CardTitle, Grid, Button, EmptyState, SectionHeader, StatCard } from '@/components/shared/UI'

const ICONS = ['💧','🏃','🧘','📚','😴','🌿','💊','🥗','🏋️','🚶','✍️','🎯','🧴','☀️','🍃']

export default function Wellness() {
  const { goals, isCompleted, completedToday, addGoal, removeGoal, toggle } = useWellness()
  const [form, setForm] = useState({ name: '', icon: '💧' })
  const [saving, setSaving] = useState(false)

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    addGoal(form)
    setForm(f => ({ ...f, name: '' }))
    setSaving(false)
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Wellness" sub="Daily habits & goal tracking" />

      <Grid cols={3} style={{ marginBottom: 16 }}>
        <StatCard label="Goals Today"  value={`${completedToday}/${goals.length}`} color="var(--teal2)" accent={(completedToday / Math.max(goals.length, 1)) * 100} />
        <StatCard label="Total Goals"  value={goals.length} color="var(--blue2)" />
        <StatCard label="Completion"   value={`${goals.length ? Math.round((completedToday / goals.length) * 100) : 0}%`} color="var(--gold2)" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Add New Goal</CardTitle>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Goal description (e.g. Drink 8 glasses of water)" required />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Choose an icon</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))} style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer', transition: 'all 0.12s',
                    border: `1px solid ${form.icon === icon ? 'var(--gold)' : 'var(--border)'}`,
                    background: form.icon === icon ? 'rgba(201,153,58,0.15)' : 'var(--bg3)',
                  }}>{icon}</button>
                ))}
              </div>
            </div>
            <Button type="submit" variant="gold" loading={saving}>Add Goal</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Progress Rings — tap to toggle</CardTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', padding: '8px 0' }}>
            {goals.length === 0
              ? <EmptyState icon="🎯" message="Add goals to see progress rings" />
              : goals.map(g => {
                const done = isCompleted(g.id)
                const r = 26, circ = 2 * Math.PI * r
                return (
                  <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }} onClick={() => toggle(g.id)}>
                    <div style={{ position: 'relative', width: 68, height: 68 }}>
                      <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="34" cy="34" r={r} fill="none" stroke="var(--bg4)" strokeWidth="5" />
                        <circle cx="34" cy="34" r={r} fill="none" stroke={done ? 'var(--teal)' : 'var(--bg4)'} strokeWidth="5"
                          strokeDasharray={circ} strokeDashoffset={done ? 0 : circ} strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s' }} />
                      </svg>
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 20, marginTop: -2 }}>{g.icon}</div>
                    </div>
                    <div style={{ fontSize: 11, color: done ? 'var(--teal2)' : 'var(--text3)', textAlign: 'center', maxWidth: 72, lineHeight: 1.3 }}>
                      {g.name.slice(0, 18)}{g.name.length > 18 ? '…' : ''}
                    </div>
                    <div style={{ fontSize: 10, color: done ? 'var(--teal2)' : 'var(--text3)' }}>{done ? '✓ done' : 'tap'}</div>
                  </div>
                )
              })
            }
          </div>
        </Card>
      </Grid>

      <Card>
        <CardTitle>All Goals</CardTitle>
        {goals.length === 0
          ? <EmptyState icon="🌱" message="Add your first wellness goal above." />
          : goals.map(g => {
            const done = isCompleted(g.id)
            return (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--radius-sm)', marginBottom: 6, border: `1px solid ${done ? 'rgba(61,184,138,0.2)' : 'var(--border)'}`, background: done ? 'rgba(61,184,138,0.05)' : 'var(--bg3)', transition: 'all 0.2s' }}>
                <span style={{ fontSize: 22 }}>{g.icon}</span>
                <span style={{ flex: 1, fontSize: 14, color: done ? 'var(--text3)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{g.name}</span>
                <Button size="sm" variant={done ? 'teal' : 'default'} onClick={() => toggle(g.id)}>{done ? '✓ Done' : 'Mark Done'}</Button>
                <button onClick={() => removeGoal(g.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: '2px 4px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text3)'}>×</button>
              </div>
            )
          })
        }
      </Card>
    </div>
  )
}
