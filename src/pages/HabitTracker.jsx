import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isFuture, subMonths, addMonths } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const FM = "'JetBrains Mono',monospace"
const F  = "'Plus Jakarta Sans',sans-serif"

const PRESET_HABITS = [
  { name:'Workout',    icon:'🏋️', color:'#a88ef0' },
  { name:'Read',       icon:'📚', color:'#5dd4a6' },
  { name:'Meditate',   icon:'🧘', color:'#6a96f0' },
  { name:'Water',      icon:'💧', color:'#6ad4f0' },
  { name:'No Sugar',   icon:'🚫', color:'#f07a62' },
  { name:'Journal',    icon:'✍️', color:'#f5c842' },
  { name:'Walk',       icon:'🚶', color:'#5dd4a6' },
  { name:'Sleep 8h',   icon:'😴', color:'#a88ef0' },
]

function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [checks, setChecks] = useState({}) // { habitId_dateKey: true }
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: h }, { data: c }] = await Promise.all([
      supabase.from('habits').select('*').order('created_at', { ascending: true }),
      supabase.from('habit_checks').select('*'),
    ])
    setHabits(h || [])
    const map = {}
    ;(c || []).forEach(r => { map[r.habit_id + '_' + r.date] = r.id })
    setChecks(map)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function addHabit(payload) {
    const { data, error } = await supabase.from('habits').insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setHabits(prev => [...prev, data])
  }

  async function deleteHabit(id) {
    await supabase.from('habits').delete().eq('id', id)
    await supabase.from('habit_checks').delete().eq('habit_id', id)
    setHabits(prev => prev.filter(h => h.id !== id))
    setChecks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (k.startsWith(id + '_')) delete next[k] })
      return next
    })
  }

  async function toggleCheck(habitId, dateKey) {
    const key = habitId + '_' + dateKey
    const existingId = checks[key]
    if (existingId) {
      await supabase.from('habit_checks').delete().eq('id', existingId)
      setChecks(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      const { data } = await supabase.from('habit_checks').insert({ habit_id: habitId, date: dateKey, user_id: user.id }).select().single()
      if (data) setChecks(prev => ({ ...prev, [key]: data.id }))
    }
  }

  function isChecked(habitId, dateKey) {
    return !!(checks[habitId + '_' + dateKey])
  }

  function getStreak(habitId) {
    let streak = 0
    let d = new Date()
    for (let i = 0; i < 365; i++) {
      const key = format(d, 'yyyy-MM-dd')
      if (isChecked(habitId, key)) { streak++; d = new Date(d.getTime() - 86400000) }
      else if (streak > 0) break
      else d = new Date(d.getTime() - 86400000)
    }
    return streak
  }

  function getMonthCount(habitId, monthStart, monthEnd) {
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
      .filter(d => isChecked(habitId, format(d, 'yyyy-MM-dd'))).length
  }

  return { habits, loading, addHabit, deleteHabit, toggleCheck, isChecked, getStreak, getMonthCount }
}

export default function HabitTracker() {
  const [month, setMonth] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [newHabit, setNewHabit] = useState({ name:'', icon:'⭐', color:'#f5c842' })
  const { habits, loading, addHabit, deleteHabit, toggleCheck, isChecked, getStreak, getMonthCount } = useHabits()

  const monthStart = startOfMonth(month)
  const monthEnd   = endOfMonth(month)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const isCurrentMonth = format(month, 'yyyy-MM') === format(new Date(), 'yyyy-MM')

  async function handleAdd(preset) {
    if (preset) {
      await addHabit({ name: preset.name, icon: preset.icon, color: preset.color })
    } else {
      if (!newHabit.name.trim()) return
      await addHabit(newHabit)
      setNewHabit({ name:'', icon:'⭐', color:'#f5c842' })
    }
    setShowAdd(false)
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Habit Tracker" sub="Build consistency day by day" accent="#5dd4a6"
        action={
          <button onClick={() => setShowAdd(s => !s)} style={{ background: showAdd ? '#f5c842' : 'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', borderRadius:10, color: showAdd ? '#1a1400' : '#f5c842', fontSize:13, fontWeight:700, padding:'8px 18px', cursor:'pointer', fontFamily:F }}>
            {showAdd ? '✕ Close' : '+ Add Habit'}
          </button>
        }
      />

      {/* Add habit panel */}
      {showAdd && (
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18, marginBottom:16 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Quick add</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
            {PRESET_HABITS.filter(p => !habits.find(h => h.name === p.name)).map(p => (
              <button key={p.name} onClick={() => handleAdd(p)} style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 13px', borderRadius:10, border:'1px solid rgba(255,255,255,0.10)', background:'rgba(255,255,255,0.05)', cursor:'pointer', fontFamily:F, transition:'all 0.15s', color:'rgba(255,255,255,0.70)', fontSize:13 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color+'55'; e.currentTarget.style.color = p.color }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}>
                <span>{p.icon}</span> {p.name}
              </button>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:14 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>Custom habit</div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={newHabit.icon} onChange={e => setNewHabit(h => ({ ...h, icon: e.target.value }))} style={{ width:52, background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, color:'#fff', fontSize:18, padding:'9px', outline:'none', textAlign:'center' }} />
              <input value={newHabit.name} onChange={e => setNewHabit(h => ({ ...h, name: e.target.value }))} placeholder="Habit name..." style={{ flex:1, background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:9, color:'#fff', fontSize:14, padding:'9px 13px', outline:'none', fontFamily:F }} />
              <input type="color" value={newHabit.color} onChange={e => setNewHabit(h => ({ ...h, color: e.target.value }))} style={{ width:44, height:44, border:'none', borderRadius:9, cursor:'pointer', background:'none' }} />
              <button onClick={() => handleAdd(null)} style={{ background:'#f5c842', border:'none', borderRadius:9, color:'#1a1400', fontSize:13, fontWeight:800, padding:'9px 16px', cursor:'pointer', fontFamily:F }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Month nav */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
        <button onClick={() => setMonth(m => subMonths(m, 1))} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 14px', cursor:'pointer', fontFamily:F }}>← Prev</button>
        <div style={{ flex:1, textAlign:'center', fontSize:15, fontWeight:700, color: isCurrentMonth ? '#5dd4a6' : '#fff' }}>{format(month, 'MMMM yyyy')}</div>
        <button onClick={() => setMonth(m => addMonths(m, 1))} disabled={isCurrentMonth} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color: isCurrentMonth ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 14px', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', fontFamily:F, opacity: isCurrentMonth ? 0.4 : 1 }}>Next →</button>
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={24} /></div>
      ) : habits.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 20px' }}>
          <div style={{ fontSize:40, marginBottom:10, opacity:0.3 }}>🎯</div>
          <div style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>No habits yet</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.22)', marginBottom:20 }}>Add your first habit to start tracking</div>
          <button onClick={() => setShowAdd(true)} style={{ background:'#f5c842', border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:700, padding:'10px 22px', cursor:'pointer', fontFamily:F }}>+ Add Habit</button>
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <div style={{ minWidth: Math.max(600, habits.length > 0 ? 700 : 0) }}>
            {/* Header row — days */}
            <div style={{ display:'grid', gridTemplateColumns:'180px repeat('+days.length+',1fr)', gap:2, marginBottom:2 }}>
              <div />
              {days.map(day => {
                const today = isToday(day)
                return (
                  <div key={day.toISOString()} style={{ textAlign:'center', fontSize:9, fontWeight: today ? 800 : 500, color: today ? '#f5c842' : 'rgba(255,255,255,0.25)', paddingBottom:4 }}>
                    {format(day, 'd')}
                  </div>
                )
              })}
            </div>

            {/* Habit rows */}
            {habits.map(habit => {
              const streak = getStreak(habit.id)
              const count  = getMonthCount(habit.id, monthStart, monthEnd)
              return (
                <div key={habit.id} style={{ display:'grid', gridTemplateColumns:'180px repeat('+days.length+',1fr)', gap:2, marginBottom:3, alignItems:'center' }}>
                  {/* Habit name */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, paddingRight:10 }}>
                    <span style={{ fontSize:16 }}>{habit.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{habit.name}</div>
                      <div style={{ display:'flex', gap:8, marginTop:1 }}>
                        {streak > 0 && <span style={{ fontSize:10, color:habit.color, fontWeight:700, fontFamily:FM }}>🔥{streak}</span>}
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontFamily:FM }}>{count}/{days.length}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.20)', fontSize:12, cursor:'pointer', padding:'2px 4px', flexShrink:0 }}>✕</button>
                  </div>

                  {/* Day cells */}
                  {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd')
                    const checked = isChecked(habit.id, dateKey)
                    const future  = isFuture(day) && !isToday(day)
                    const today   = isToday(day)
                    return (
                      <button
                        key={dateKey}
                        onClick={() => !future && toggleCheck(habit.id, dateKey)}
                        style={{
                          width:'100%', aspectRatio:'1', borderRadius:5, border:'none', cursor: future ? 'default' : 'pointer',
                          background: checked ? habit.color : future ? 'rgba(255,255,255,0.03)' : today ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
                          boxShadow: checked ? '0 0 6px '+habit.color+'60' : today && !checked ? 'inset 0 0 0 1.5px rgba(255,255,255,0.18)' : 'none',
                          transition:'all 0.15s',
                          opacity: future ? 0.3 : 1,
                        }}
                        onMouseEnter={e => { if (!future) e.currentTarget.style.transform = 'scale(1.25)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {habits.length > 0 && (
        <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'rgba(255,255,255,0.30)' }}>
          <span>🔥 = current streak</span>
          <span>Tap a cell to toggle</span>
          <span>Numbers = completed / total days this month</span>
        </div>
      )}
    </div>
  )
}
