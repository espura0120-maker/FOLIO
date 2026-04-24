import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useWellness } from '@/hooks/useData'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const F  = "'Plus Jakarta Sans',sans-serif"
const FM = "'JetBrains Mono',monospace"

const GOAL_ICONS = ['💧','🏃','🧘','📚','😴','🌿','💊','🥗','🏋️','🚶','✍️','🎯','🧴','☀️','🌳']

function useSleepLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('sleep_logs').select('*').order('date', { ascending: false }).limit(30)
    setLogs(data || [])
  }, [user])

  useEffect(() => { load() }, [load])

  async function addSleep(date, hours, quality) {
    const { data, error } = await supabase.from('sleep_logs')
      .upsert({ user_id: user.id, date, hours: parseFloat(hours), quality }, { onConflict:'user_id,date' })
      .select().single()
    if (!error) setLogs(prev => {
      const next = prev.filter(l => l.date !== date)
      return [data, ...next].sort((a,b) => b.date.localeCompare(a.date))
    })
  }

  const avgSleep = logs.length ? (logs.reduce((s,l)=>s+(+l.hours),0)/logs.length).toFixed(1) : '—'
  const lastSleep = logs[0]

  return { logs, addSleep, avgSleep, lastSleep }
}

function SleepBar({ hours }) {
  const target = 8
  const pct = Math.min((hours/target)*100, 100)
  const color = hours >= 7.5 ? '#5dd4a6' : hours >= 6 ? '#f5c842' : '#f07a62'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, background:'rgba(255,255,255,0.07)', borderRadius:99, height:5, overflow:'hidden' }}>
        <div style={{ width:pct+'%', height:'100%', background:color, borderRadius:99, transition:'width 0.5s ease' }} />
      </div>
      <span style={{ fontFamily:FM, fontSize:12, color, minWidth:28 }}>{hours}h</span>
    </div>
  )
}

export default function Wellness() {
  const { goals, isCompleted, completedToday, loading: goalsLoading, addGoal, deleteGoal, toggleCheckin } = useWellness()
  const { logs: sleepLogs, addSleep, avgSleep, lastSleep } = useSleepLogs()

  const [goalForm, setGoalForm]   = useState({ name:'', icon:'💧' })
  const [goalSaving, setGoalSaving] = useState(false)
  const [tab, setTab]             = useState('goals') // goals | sleep
  const [sleepForm, setSleepForm] = useState({ date: format(new Date(),'yyyy-MM-dd'), hours:'', quality:'good' })
  const [sleepSaving, setSleepSaving] = useState(false)

  async function handleAddGoal(e) {
    e.preventDefault()
    if (!goalForm.name) return
    setGoalSaving(true)
    await addGoal(goalForm)
    setGoalForm(f => ({ ...f, name:'' }))
    setGoalSaving(false)
  }

  async function handleAddSleep(e) {
    e.preventDefault()
    if (!sleepForm.hours) return
    setSleepSaving(true)
    await addSleep(sleepForm.date, sleepForm.hours, sleepForm.quality)
    setSleepForm(f => ({ ...f, hours:'' }))
    setSleepSaving(false)
  }

  const inp = { background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#fff', fontSize:13, padding:'9px 12px', outline:'none', fontFamily:F, width:'100%', boxSizing:'border-box' }

  return (
    <div className="fade-up">
      <SectionHeader title="Wellness" sub="Daily goals & sleep tracking" accent="#5dd4a6" />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Goals Today',  value:`${completedToday}/${goals.length}`, color:'#5dd4a6' },
          { label:'Completion',   value:`${goals.length ? Math.round(completedToday/goals.length*100) : 0}%`, color:'#f5c842' },
          { label:'Avg Sleep',    value:avgSleep==='—'?'—':avgSleep+'h', color:'#a88ef0' },
          { label:'Last Night',   value:lastSleep ? lastSleep.hours+'h' : '—', color:'#6a96f0' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:FM, fontSize:20, fontWeight:500, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3, gap:2, marginBottom:16, width:'fit-content' }}>
        {[['goals','🎯 Goals'],['sleep','😴 Sleep']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding:'7px 18px', borderRadius:8, border:'none', fontFamily:F, background:tab===v?'#f5c842':'transparent', color:tab===v?'#1a1400':'rgba(255,255,255,0.45)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>{l}</button>
        ))}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Add goal */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:14 }}>Add Goal</div>
            <form onSubmit={handleAddGoal} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <input value={goalForm.name} onChange={e => setGoalForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Drink 8 glasses of water" required style={inp} />
              <div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Icon</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {GOAL_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setGoalForm(f=>({...f,icon}))}
                      style={{ width:36, height:36, borderRadius:8, fontSize:18, cursor:'pointer', border:`1px solid ${goalForm.icon===icon?'rgba(245,200,66,0.55)':'rgba(255,255,255,0.09)'}`, background:goalForm.icon===icon?'rgba(245,200,66,0.14)':'rgba(255,255,255,0.05)' }}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={goalSaving} style={{ background:'#f5c842', border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:800, padding:'11px', cursor:'pointer', fontFamily:F, opacity:goalSaving?0.6:1 }}>
                {goalSaving ? 'Adding...' : 'Add Goal'}
              </button>
            </form>
          </div>

          {/* Today's rings */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:14 }}>Today's Progress — tap to toggle</div>
            {goalsLoading ? <div style={{ display:'flex', justifyContent:'center', padding:30 }}><Spinner size={20} /></div>
            : goals.length === 0 ? <div style={{ textAlign:'center', padding:'30px 10px', fontSize:13, color:'rgba(255,255,255,0.30)' }}>Add goals to see progress rings</div>
            : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:14, justifyContent:'center' }}>
                {goals.map(g => {
                  const done = isCompleted(g.id)
                  const r = 24, circ = 2 * Math.PI * r
                  return (
                    <div key={g.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'pointer' }} onClick={() => toggleCheckin(g.id)}>
                      <div style={{ position:'relative', width:62, height:62 }}>
                        <svg width="62" height="62" style={{ transform:'rotate(-90deg)' }}>
                          <circle cx="31" cy="31" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                          <circle cx="31" cy="31" r={r} fill="none" stroke={done?'#5dd4a6':'rgba(255,255,255,0.07)'} strokeWidth="5"
                            strokeDasharray={circ} strokeDashoffset={done?0:circ} strokeLinecap="round"
                            style={{ transition:'stroke-dashoffset 0.4s ease, stroke 0.3s', filter:done?'drop-shadow(0 0 4px #5dd4a690)':'none' }} />
                        </svg>
                        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:18 }}>{g.icon}</div>
                      </div>
                      <div style={{ fontSize:10, color:done?'#5dd4a6':'rgba(255,255,255,0.35)', textAlign:'center', maxWidth:66, lineHeight:1.3 }}>
                        {g.name.slice(0,18)}{g.name.length>18?'…':''}
                      </div>
                      <div style={{ fontSize:9, color:done?'#5dd4a6':'rgba(255,255,255,0.28)' }}>{done?'✓ done':'tap'}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Goals list */}
          <div style={{ gridColumn:'1/-1', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:12 }}>All Goals</div>
            {goals.length === 0
              ? <div style={{ textAlign:'center', padding:'20px 0', fontSize:13, color:'rgba(255,255,255,0.30)' }}>Add your first goal above</div>
              : goals.map(g => {
                const done = isCompleted(g.id)
                return (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, marginBottom:4, border:`1px solid ${done?'rgba(93,212,166,0.20)':'rgba(255,255,255,0.07)'}`, background:done?'rgba(93,212,166,0.06)':'rgba(255,255,255,0.03)', transition:'all 0.2s' }}>
                    <span style={{ fontSize:20 }}>{g.icon}</span>
                    <span style={{ flex:1, fontSize:13, color:done?'rgba(255,255,255,0.40)':'rgba(255,255,255,0.80)', textDecoration:done?'line-through':'none' }}>{g.name}</span>
                    <button onClick={() => toggleCheckin(g.id)} style={{ background:done?'rgba(93,212,166,0.14)':'rgba(255,255,255,0.06)', border:`1px solid ${done?'rgba(93,212,166,0.30)':'rgba(255,255,255,0.10)'}`, borderRadius:8, color:done?'#5dd4a6':'rgba(255,255,255,0.50)', fontSize:12, fontWeight:700, padding:'5px 12px', cursor:'pointer', fontFamily:F }}>
                      {done?'✓ Done':'Mark Done'}
                    </button>
                    <button onClick={() => deleteGoal(g.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.22)', cursor:'pointer', fontSize:16, padding:'2px 5px' }}
                      onMouseEnter={e=>e.target.style.color='#f07a62'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.22)'}>×</button>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}

      {/* Sleep tab */}
      {tab === 'sleep' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Log sleep */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:14 }}>Log Sleep</div>
            <form onSubmit={handleAddSleep} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Date</label>
                <input type="date" value={sleepForm.date} onChange={e=>setSleepForm(f=>({...f,date:e.target.value}))} style={{ ...inp, colorScheme:'dark' }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Hours slept</label>
                <input type="number" value={sleepForm.hours} onChange={e=>setSleepForm(f=>({...f,hours:e.target.value}))} placeholder="e.g. 7.5" min="0" max="24" step="0.5" required style={inp} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:8, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Quality</label>
                <div style={{ display:'flex', gap:6 }}>
                  {[['poor','😴'],['okay','🙂'],['good','😊'],['great','🤩']].map(([q,e]) => (
                    <button key={q} type="button" onClick={() => setSleepForm(f=>({...f,quality:q}))}
                      style={{ flex:1, padding:'8px 4px', borderRadius:9, fontFamily:F, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:sleepForm.quality===q?'1px solid rgba(168,142,240,0.45)':'1px solid rgba(255,255,255,0.09)', background:sleepForm.quality===q?'rgba(168,142,240,0.14)':'rgba(255,255,255,0.04)', color:sleepForm.quality===q?'#a88ef0':'rgba(255,255,255,0.45)', textAlign:'center' }}>
                      <div>{e}</div>
                      <div style={{ fontSize:10, marginTop:2, textTransform:'capitalize' }}>{q}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={sleepSaving} style={{ background:'#a88ef0', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:800, padding:'11px', cursor:'pointer', fontFamily:F, opacity:sleepSaving?0.6:1 }}>
                {sleepSaving ? 'Saving...' : 'Log Sleep'}
              </button>
            </form>
          </div>

          {/* Sleep history */}
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)' }}>Sleep History</div>
              <div style={{ fontFamily:FM, fontSize:14, color:'#a88ef0' }}>avg {avgSleep}h</div>
            </div>
            {sleepLogs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'30px 10px', fontSize:13, color:'rgba(255,255,255,0.30)' }}>No sleep data yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {sleepLogs.slice(0, 14).map(l => {
                  const qColor = l.quality==='great'?'#a88ef0':l.quality==='good'?'#5dd4a6':l.quality==='okay'?'#f5c842':'#f07a62'
                  return (
                    <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)', minWidth:70, fontFamily:FM }}>{l.date}</span>
                      <div style={{ flex:1 }}><SleepBar hours={+l.hours} /></div>
                      {l.quality && <span style={{ fontSize:9, background:qColor+'18', border:'1px solid '+qColor+'30', borderRadius:5, padding:'1px 6px', color:qColor, fontWeight:700, textTransform:'uppercase', minWidth:30, textAlign:'center' }}>{l.quality}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
