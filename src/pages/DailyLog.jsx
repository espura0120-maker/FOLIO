import { useState, useEffect, useCallback } from 'react'
import { format, subDays, addDays, isToday } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const FM = "'JetBrains Mono',monospace"
const F  = "'Plus Jakarta Sans',sans-serif"

const BULLET_TYPES = [
  { symbol: '💼', type: 'work',     label: 'Work',     color: '#6a96f0', desc: 'Work task' },
  { symbol: '🏠', type: 'personal', label: 'Personal', color: '#f5c842', desc: 'Personal task' },
  { symbol: '–',  type: 'note',     label: 'Note',     color: '#a88ef0', desc: 'Information or thought' },
  { symbol: '○',  type: 'event',    label: 'Event',    color: '#5dd4a6', desc: 'Something that happened' },
  { symbol: '★',  type: 'priority', label: 'Priority', color: '#f07a62', desc: 'Important priority' },
]

function getBullet(type) {
  return BULLET_TYPES.find(b => b.type === type) || BULLET_TYPES[0]
}

function useDailyLog(dateKey) {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('daily_log_entries')
      .select('*')
      .eq('date', dateKey)
      .order('created_at', { ascending: true })
    setEntries(data || [])
    setLoading(false)
  }, [user, dateKey])

  useEffect(() => { load() }, [load])

  async function addEntry(payload) {
    const { data, error } = await supabase
      .from('daily_log_entries')
      .insert({ ...payload, user_id: user.id, date: dateKey })
      .select().single()
    if (!error) setEntries(prev => [...prev, data])
    return { data, error }
  }

  async function toggleComplete(id, completed) {
    const { data, error } = await supabase
      .from('daily_log_entries')
      .update({ completed: !completed })
      .eq('id', id)
      .select().single()
    if (!error) setEntries(prev => prev.map(e => e.id === id ? data : e))
  }

  async function migrateEntry(id) {
    const tomorrow = format(addDays(new Date(dateKey), 1), 'yyyy-MM-dd')
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    await supabase.from('daily_log_entries').update({ migrated: true }).eq('id', id)
    const { data } = await supabase.from('daily_log_entries')
      .insert({ ...entry, id: undefined, date: tomorrow, migrated: false, completed: false, migrated_from: dateKey })
      .select().single()
    setEntries(prev => prev.map(e => e.id === id ? { ...e, migrated: true } : e))
  }

  async function deleteEntry(id) {
    await supabase.from('daily_log_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return { entries, loading, addEntry, toggleComplete, migrateEntry, deleteEntry }
}

export default function DailyLog() {
  const [date, setDate] = useState(new Date())
  const dateKey = format(date, 'yyyy-MM-dd')
  const { entries, loading, addEntry, toggleComplete, migrateEntry, deleteEntry } = useDailyLog(dateKey)

  const [text, setText] = useState('')
  const [bulletType, setBulletType] = useState('work')
  const [saving, setSaving] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)

  const isDateToday = isToday(date)
  const bullet = getBullet(bulletType)

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    await addEntry({ text: text.trim(), type: bulletType, completed: false, migrated: false })
    setText('')
    setSaving(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd(e)
    }
    // Quick bullet type switching
    if (e.key === '1') setBulletType('work')
    if (e.key === '2') setBulletType('personal')
    if (e.key === '3') setBulletType('note')
    if (e.key === '4') setBulletType('event')
    if (e.key === '5') setBulletType('priority')
  }

  const tasks     = entries.filter(e => e.type === 'work' || e.type === 'personal' || e.type === 'priority')
  const completed = tasks.filter(e => e.completed).length
  const total     = tasks.length

  return (
    <div className="fade-up">
      <SectionHeader title="Daily Log" sub="Rapid logging for your day" accent="#f5c842" />

      {/* Date navigation */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => setDate(d => subDays(d, 1))} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 13px', cursor:'pointer', fontFamily:F }}>← Prev</button>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:700, color: isDateToday ? '#f5c842' : '#fff' }}>
            {isDateToday ? 'Today' : format(date, 'EEEE')}
          </div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{format(date, 'MMMM d, yyyy')}</div>
        </div>
        <button onClick={() => setDate(d => addDays(d, 1))} disabled={isDateToday} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color: isDateToday ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 13px', cursor: isDateToday ? 'not-allowed' : 'pointer', fontFamily:F, opacity: isDateToday ? 0.4 : 1 }}>Next →</button>
        {!isDateToday && (
          <button onClick={() => setDate(new Date())} style={{ background:'rgba(245,200,66,0.12)', border:'1px solid rgba(245,200,66,0.28)', borderRadius:9, color:'#f5c842', fontSize:12, padding:'6px 12px', cursor:'pointer', fontFamily:F, fontWeight:700 }}>Today</button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.40)', fontWeight:600 }}>Tasks</span>
            <span style={{ fontSize:12, color:'#5dd4a6', fontWeight:700, fontFamily:FM }}>{completed}/{total}</span>
          </div>
          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:4, overflow:'hidden' }}>
            <div style={{ width: total > 0 ? (completed/total*100)+'%' : '0%', height:'100%', background:'#5dd4a6', borderRadius:99, transition:'width 0.5s ease', boxShadow:'0 0 8px rgba(93,212,166,0.5)' }} />
          </div>
        </div>
      )}

      {/* Entry input */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:16, marginBottom:16 }}>
        {/* Bullet type selector */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          {BULLET_TYPES.map(b => (
            <button key={b.type} onClick={() => setBulletType(b.type)} style={{ flex:1, padding:'7px 6px', borderRadius:9, border: bulletType===b.type ? '1px solid '+b.color+'55' : '1px solid rgba(255,255,255,0.08)', background: bulletType===b.type ? b.color+'18' : 'rgba(255,255,255,0.04)', cursor:'pointer', fontFamily:F, transition:'all 0.15s', display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <span style={{ fontFamily:FM, fontSize:16, color: bulletType===b.type ? b.color : 'rgba(255,255,255,0.35)' }}>{b.symbol}</span>
              <span style={{ fontSize:10, fontWeight:700, color: bulletType===b.type ? b.color : 'rgba(255,255,255,0.30)', letterSpacing:'0.05em', textTransform:'uppercase' }}>{b.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleAdd} style={{ display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontFamily:FM, fontSize:18, color:bullet.color, flexShrink:0, width:20, textAlign:'center' }}>{bullet.symbol}</span>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Add ${bullet.label.toLowerCase()} task... (Enter to save, 1-5 to switch type)`}
            autoFocus
            style={{ flex:1, background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#fff', fontSize:14, padding:'10px 13px', outline:'none', fontFamily:F, boxSizing:'border-box' }}
            onFocus={e => e.target.style.borderColor = bullet.color+'80'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button type="submit" disabled={saving || !text.trim()} style={{ background:bullet.color, border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:800, padding:'10px 16px', cursor: saving||!text.trim() ? 'not-allowed' : 'pointer', fontFamily:F, opacity: saving||!text.trim() ? 0.5 : 1, flexShrink:0 }}>
            {saving ? '...' : 'Log'}
          </button>
        </form>
      </div>

      {/* Entries list */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={24} /></div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign:'center', padding:'50px 20px' }}>
          <div style={{ fontSize:40, marginBottom:10, opacity:0.3 }}>✦</div>
          <div style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.35)', marginBottom:6 }}>No entries yet</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.22)' }}>Start logging your day above</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* Group: Work tasks */}
          {['work','personal','priority','note','event'].map(group => {
            const groupEntries = entries.filter(e => e.type === group)
            if (groupEntries.length === 0) return null
            const groupBullet = getBullet(group)
            const groupLabel = group === 'work' ? '💼 Work' : group === 'personal' ? '🏠 Personal' : group === 'priority' ? '★ Priorities' : group === 'note' ? '– Notes' : '○ Events'
            return (
              <div key={group}>
                <div style={{ fontSize:11, fontWeight:700, color:groupBullet.color, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ height:1, flex:1, background:groupBullet.color+'25' }} />
                  {groupLabel}
                  <div style={{ height:1, flex:1, background:groupBullet.color+'25' }} />
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {groupEntries.map(entry => {
            const b = getBullet(entry.type)
            const isTask = entry.type === 'work' || entry.type === 'personal' || entry.type === 'priority'
            const isHovered = hoveredId === entry.id
            return (
              <div key={entry.id}
                onMouseEnter={() => setHoveredId(entry.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:11, background: isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border:'1px solid '+(isHovered?'rgba(255,255,255,0.10)':'rgba(255,255,255,0.055)'), transition:'all 0.15s', opacity: entry.migrated ? 0.4 : 1 }}
              >
                {/* Symbol / checkbox */}
                {isTask ? (
                  <button onClick={() => toggleComplete(entry.id, entry.completed)} style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, border:'1.5px solid '+(entry.completed?b.color:'rgba(255,255,255,0.22)'), background:entry.completed?b.color+'22':'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:b.color, fontSize:11, fontWeight:700, transition:'all 0.2s', boxShadow:entry.completed?'0 0 8px '+b.color+'55':'none' }}>
                    {entry.completed ? '✓' : ''}
                  </button>
                ) : (
                  <span style={{ fontFamily:FM, fontSize:16, color:b.color, flexShrink:0, width:22, textAlign:'center' }}>{b.symbol}</span>
                )}

                {/* Text */}
                <span style={{ flex:1, fontSize:14, color: entry.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)', textDecoration: entry.completed ? 'line-through' : 'none', lineHeight:1.5, transition:'all 0.2s' }}>
                  {entry.migrated_from && <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)', marginRight:6, fontFamily:FM }}>↩</span>}
                  {entry.text}
                </span>

                {/* Type badge */}
                <span style={{ fontSize:9, fontWeight:700, color:b.color, background:b.color+'18', border:'1px solid '+b.color+'35', borderRadius:5, padding:'2px 6px', letterSpacing:'0.05em', textTransform:'uppercase', flexShrink:0 }}>{b.label}</span>

                {/* Actions */}
                {isHovered && (
                  <div style={{ display:'flex', gap:5, flexShrink:0 }}>
                    {isTask && !entry.completed && !entry.migrated && entry.type !== 'note' && entry.type !== 'event' && (
                      <button onClick={() => migrateEntry(entry.id)} title="Migrate to tomorrow" style={{ background:'rgba(245,200,66,0.12)', border:'1px solid rgba(245,200,66,0.25)', borderRadius:7, color:'#f5c842', fontSize:11, padding:'3px 8px', cursor:'pointer', fontFamily:F, fontWeight:700 }}>→ tmrw</button>
                    )}
                    <button onClick={() => deleteEntry(entry.id)} style={{ background:'rgba(240,122,98,0.10)', border:'1px solid rgba(240,122,98,0.22)', borderRadius:7, color:'#f07a62', fontSize:11, padding:'3px 7px', cursor:'pointer' }}>✕</button>
                  </div>
                )}
              </div>
            )
          })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:14, marginTop:20, flexWrap:'wrap', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        {BULLET_TYPES.map(b => (
          <div key={b.type} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:FM, fontSize:14, color:b.color }}>{b.symbol}</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
