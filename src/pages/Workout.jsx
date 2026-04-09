import { useState } from 'react'
import { useWorkouts, useProfile } from '@/hooks/useData'
import { Card, CardTitle, Grid, Button, ListItem, EmptyState, SectionHeader, StatCard } from '@/components/shared/UI'

const TYPES = ['Strength','Cardio','HIIT','Yoga','Sports','Other']

export default function Workout() {
  const { sessions, add, remove, sessionsThisWeek, totalVolume } = useWorkouts()
  const { profile } = useProfile()
const weightUnit = profile?.weight_unit || 'kg'
  const [saving, setSaving] = useState(false)
  const [session, setSession] = useState({ name: '', type: 'Strength', duration_mins: '', notes: '' })
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }])
  const setS = k => e => setSession(s => ({ ...s, [k]: e.target.value }))
  const setE = (i, k) => e => setExercises(ex => ex.map((x, idx) => idx === i ? { ...x, [k]: e.target.value } : x))
  const addRow = () => setExercises(ex => [...ex, { name: '', sets: '', reps: '', weight: '' }])
  const removeRow = i => setExercises(ex => ex.filter((_, idx) => idx !== i))

  function handleLog(e) {
    e.preventDefault()
    if (!session.name) return
    setSaving(true)
    const validEx = exercises.filter(ex => ex.name.trim())
    const volume = validEx.reduce((s, ex) => s + (+ex.sets||0) * (+ex.reps||0) * (+ex.weight||0), 0)
    add({ ...session, duration_mins: +session.duration_mins || 0, total_volume: volume, exercises: validEx.map(ex => ({ name: ex.name, sets: +ex.sets||0, reps: +ex.reps||0, weight: +ex.weight||0 })) })
    setSession({ name: '', type: 'Strength', duration_mins: '', notes: '' })
    setExercises([{ name: '', sets: '', reps: '', weight: '' }])
    setSaving(false)
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Workout" sub="Log and track your training sessions" />

      <Grid cols={3} style={{ marginBottom: 16 }}>
        <StatCard label="Total Sessions" value={sessions.length}  color="var(--purple2)" />
        <StatCard label="This Week"      value={sessionsThisWeek} color="var(--blue2)" />
        <StatCard label="Total Volume"   value={`${totalVolume.toLocaleString()} ${weightUnit}`} color="var(--teal2)" />
      </Grid>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Log New Session</CardTitle>
        <form onSubmit={handleLog} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={session.name} onChange={setS('name')} placeholder="Session name (e.g. Push Day)" required style={{ flex: 2 }} />
            <select value={session.type} onChange={setS('type')} style={{ flex: 1 }}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <input type="number" value={session.duration_mins} onChange={setS('duration_mins')} placeholder="Mins" min={1} style={{ maxWidth: 80 }} />
          </div>

          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 65px 65px 90px 28px', gap: 6, marginBottom: 8 }}>
              {['Exercise','Sets','Reps','Weight (lbs)',''].map((h, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
              ))}
            </div>
            {exercises.map((ex, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 65px 65px 90px 28px', gap: 6, marginBottom: 6 }}>
                <input value={ex.name}   onChange={setE(i,'name')}   placeholder="Exercise"  style={{ fontSize: 13, padding: '7px 9px' }} />
                <input value={ex.sets}   onChange={setE(i,'sets')}   type="number" min={0} placeholder="0"  style={{ fontSize: 13, padding: '7px 9px' }} />
                <input value={ex.reps}   onChange={setE(i,'reps')}   type="number" min={0} placeholder="0"  style={{ fontSize: 13, padding: '7px 9px' }} />
                <input value={ex.weight} onChange={setE(i,'weight')} type="number" min={0} step="2.5" placeholder="0" style={{ fontSize: 13, padding: '7px 9px' }} />
                <button type="button" onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            ))}
            <Button type="button" size="sm" onClick={addRow}>+ Add Exercise</Button>
          </div>

          <textarea value={session.notes} onChange={setS('notes')} placeholder="Session notes (optional)" style={{ minHeight: 50 }} />
          <Button type="submit" variant="gold" loading={saving}>Log Session</Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Session History</CardTitle>
        {sessions.length === 0
          ? <EmptyState icon="🏋️" message="No sessions logged yet." />
          : sessions.map(s => {
            const exStr = s.exercises?.map(e => `${e.name} ${e.sets}×${e.reps}${e.weight?` @ ${e.weight}lbs`:''}`).join(' · ') || ''
            return (
              <ListItem key={s.id} icon={s.type[0]} iconBg="rgba(138,110,216,0.15)"
                name={s.name}
                sub={`${s.date} · ${s.duration_mins}min${exStr ? ' · ' + exStr.slice(0, 70) + (exStr.length > 70 ? '…' : '') : ''}`}
                right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--purple2)' }}>{s.total_volume > 0 ? `${(+s.total_volume).toLocaleString()} lbs` : s.type}</span>}
                onDelete={() => remove(s.id)} />
            )
          })
        }
      </Card>
    </div>
  )
}
