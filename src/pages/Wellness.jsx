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
  const isFuture = selectedDate > new Date()

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
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Goal description" required />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Choose an icon</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => setForm(f => ({ ...f, icon }))} style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 18, cursor: 'pointer', transition: 'all 0.12s',
                    border: `1px solid ${form.icon === icon ? 'var(--gold)' : 'var(--b
