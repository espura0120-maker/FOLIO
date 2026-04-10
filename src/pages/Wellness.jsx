import { useState } from 'react'
import { format, addDays, subDays, isToday } from 'date-fns'
import { useWellness } from '@/hooks/useData'
import { Card, CardTitle, Grid, Button, EmptyState, SectionHeader, StatCard } from '@/components/shared/UI'

const ICONS = ['💧','🏃','🧘','📚','😴','🌿','💊','🥗','🏋️','🚶','✍️','🎯','🧴','☀️','🍃']

export default function Wellness() {
  const { goals, isCompleted, completedToday, addGoal, removeGoal, toggle, checkins } = useWellness()
  const [form, setForm] = useState({ name: '', icon: '💧' })
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const dateKey = format(selectedDate, 'yyyy-MM-dd')
  const isSelectedToday = isToday(selectedDate)

  // Count completions for the selected date
  const completedOnDate = goals.filter(g =>
    checkins.some(c => c.goal_id === g.id && c.date === dateKey)
  ).length

  const isCompletedOnDate = (goalId) =>
    checkins.some(c => c.goal_id === goalId && c.date === dateKey)

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    addGoal(form)
    setForm(f => ({ ...f, name: '' }))
    setSaving(false)
  }

  // Toggle for selected date — only allow past/today, not future
  function handleToggle(goalId) {
    const futureDate = selectedDate > new Date()
    if (futureDate) return
    toggle(goalId, dateKey)
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
        {/* Add goal */}
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

        {/* Progress rings */}
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
                    <div style={{ fontSize: 11, color: d
