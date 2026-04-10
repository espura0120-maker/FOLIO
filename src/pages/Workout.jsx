import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useWorkouts, useProfile } from '@/hooks/useData'
import { Card, CardTitle, Grid, Button, EmptyState, SectionHeader, StatCard } from '@/components/shared/UI'

const TYPES = ['Strength','Cardio','HIIT','Yoga','Sports','Other']

export default function Workout() {
  const { sessions, add, remove, sessionsThisWeek } = useWorkouts()
  const { profile } = useProfile()
  const weightUnit = profile?.weight_unit || 'kg'

  // ── Session form state ──────────────────────────────────────────────────────
  const [sessionName, setSessionName] = useState('')
  const [sessionType, setSessionType] = useState('Strength')
  const [sessionDate, setSessionDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sessionDuration, setSessionDuration] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')

  // ── Exercise builder state ──────────────────────────────────────────────────
  const [exForm, setExForm] = useState({ name: '', sets: '', reps: '', weight: '' })
  const [savedExercises, setSavedExercises] = useState([])
  const [saving, setSaving] = useState(false)

  const setEx = k => e => setExForm(f => ({ ...f, [k]: e.target.value }))

  function saveExercise() {
    if (!exForm.name.trim()) return
    setSavedExercises(prev => [...prev, { ...exForm, id: Date.now() }])
    setExForm({ name: '', sets: '', reps: '', weight: '' })
  }

  function deleteExercise(id) {
    setSavedExercises(prev => prev.filter(e => e.id !== id))
  }

  async function handleLogSession() {
    if (!sessionName.trim()) return
    setSaving(true)
    const volume = savedExercises.reduce((s, ex) => s + (+ex.sets||0) * (+ex.reps||0) * (+ex.weight||0), 0)
    await add({
      session: {
        name: sessionName,
        type: sessionType,
        duration_mins: +sessionDuration || 0,
        total_volume: volume,
        notes: sessionNotes,
        date: sessionDate,
      },
      exercises: savedExercises.map((ex, i) => ({
        name: ex.name,
        sets: +ex.sets || 0,
        reps: +ex.reps || 0,
        weight: +ex.weight || 0,
        sort_order: i,
      }))
    })
    // Reset everything
    setSessionName('')
    setSessionType('Strength')
    setSessionDate(format(new Date(), 'yyyy-MM-dd'))
    setSessionDuration('')
    setSessionNotes('')
    setSavedExercises([])
    setSaving(false)
  }

  // ── Workout streak calculation ───────────────────────────────────────────────
  const workoutStreak = (() => {
    if (!sessions.length) return 0
    const dates = new Set(sessions.map(s => s.date))
    let count = 0
    let check = new Date()
    for (let i = 0; i < 365; i++) {
      const key = format(check, 'yyyy-MM-dd')
      if (dates.has(key)) { count++; check = subDays(check, 1) }
      else if (count > 0) break
      else check = subDays(check, 1)
    }
    return count
  })()

  return (
    <div className="fade-up">
      <SectionHeader title="Workout" sub="Log and track your training sessions" />

      <Grid cols={3} style={{ marginBottom: 16 }}>
        <StatCard label="Total Sessions" value={sessions.length}  color="var(--purple2)" />
        <StatCard label="This Week"      value={sessionsThisWeek} color="var(--blue2)" />
        <StatCard label="Workout Streak" value={`${workoutStreak} 🔥`} color="var(--teal2)" sub="days in a row" />
      </Grid>

      {/* ── Session Info ──────────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 12 }}>
        <CardTitle>Session Info</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Session name (e.g. Push Day)"
              style={{ flex: 2, minWidth: 160 }}
            />
            <select value={sessionType} onChange={e => setSessionType(e.target.value)} style={{ flex: 1, minWidth: 110 }}>
              {TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Duration (min)</label>
              <input
                type="number"
                value={sessionDuration}
                onChange={e => setSessionDuration(e.target.value)}
                placeholder="e.g. 60"
                min={1}
              />
            </div>
          </div>
          <textarea
            value={sessionNotes}
            onChange={e => setSessionNotes(e.target.value)}
            placeholder="Session notes (optional)"
            style={{ minHeight: 50 }}
          />
        </div>
      </Card>

      {/* ── Exercise Builder ──────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 12 }}>
        <CardTitle>Add Exercise</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 100px auto', gap: 8, alignItems: 'end', marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Exercise</label>
            <input value={exForm.name} onChange={setEx('name')} placeholder="e.g. Bench Press"
              onKeyDown={e => e.key === 'Enter' && saveExercise()}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Sets</label>
            <input type="number" value={exForm.sets} onChange={setEx('sets')} min={0} placeholder="0" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Reps</label>
            <input type="number" value={exForm.reps} onChange={setEx('reps')} min={0} placeholder="0" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Weight ({weightUnit})</label>
            <input type="number" value={exForm.weight} onChange={setEx('weight')} min={0} step="0.5" placeholder="0" />
          </div>
          <Button variant="teal" onClick={saveExercise} style={{ alignSelf: 'end' }}>
            Save
          </Button>
        </div>

        {/* Saved exercises list */}
        {savedExercises.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
              Saved Exercises ({savedExercises.length})
            </div>
            {savedExercises.map((ex, i) => (
              <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', background: 'var(--bg3)',
                borderRadius: 'var(--radius-sm)', marginBottom: 6,
                border: '1px solid var(--border)',
              }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                    {ex.sets || 0} sets × {ex.reps || 0} reps
                    {ex.weight ? ` @ ${ex.weight} ${weightUnit}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => deleteExercise(ex.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: '2px 4px' }}
                  onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
                  onMouseLeave={e => e.target.style.color = 'var(--text3)'}
                >×</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Log Session Button ────────────────────────────────────────────── */}
      <Button
        variant="gold"
        fullWidth
        loading={saving}
        onClick={handleLogSession}
        disabled={!sessionName.trim()}
        style={{ marginBottom: 20 }}
      >
        {savedExercises.length > 0
          ? `Log Session (${savedExercises.length} exercise${savedExercises.length > 1 ? 's' : ''})`
          : 'Log Session'
        }
      </Button>

      {/* ── Session History ───────────────────────────────────────────────── */}
      <Card>
        <CardTitle>Session History</CardTitle>
        {sessions.length === 0
          ? <EmptyState icon="🏋️" message="No sessions logged yet." />
          : sessions.map(s => {
            const exList = s.exercises || []
            return (
              <div key={s.id} style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', marginBottom: 8, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(138,110,216,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600, color: 'var(--purple2)', flexShrink: 0 }}>
                    {s.type[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>
                      {s.type} · {s.duration_mins ? `${s.duration_mins} min` : 'Duration not set'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--gold2)', fontWeight: 500 }}>
                      {s.date}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      {exList.length} exercise{exList.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(s.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: '2px 4px', flexShrink: 0 }}
                    onMouseEnter={e => e.target.style.color = 'var(--coral2)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text3)'}
                  >×</button>
                </div>

                {/* Exercise breakdown */}
                {exList.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 14px 10px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {exList.map((ex, i) => (
                        <div key={i} style={{
                          background: 'var(--bg4)', borderRadius: 'var(--radius-sm)',
                          padding: '4px 10px', fontSize: 12,
                        }}>
                          <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{ex.name}</span>
                          <span style={{ color: 'var(--text3)', marginLeft: 6 }}>
                            {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}${weightUnit}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                    {s.notes && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, fontStyle: 'italic' }}>{s.notes}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        }
      </Card>
    </div>
  )
}
