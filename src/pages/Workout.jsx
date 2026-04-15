import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useWorkouts, useProfile } from '@/hooks/useData'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, Grid, Button, EmptyState, SectionHeader, StatCard } from '@/components/shared/UI'

const TYPES = ['Strength','Cardio','HIIT','Yoga','Sports','Other']

// ── Weight logs hook ───────────────────────────────────────────────────────
function useWeightLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('weight_logs').select('*').order('date', { ascending: false }).limit(30)
    setLogs(data || [])
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function add(payload) {
    const { data, error } = await supabase.from('weight_logs').insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setLogs(prev => [data, ...prev])
  }

  async function remove(id) {
    await supabase.from('weight_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, add, remove }
}

// ── Templates hook ─────────────────────────────────────────────────────────
function useTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('workout_templates').select('*').order('created_at', { ascending: false })
    setTemplates(data || [])
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function save(payload) {
    const { data, error } = await supabase.from('workout_templates').insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setTemplates(prev => [data, ...prev])
  }

  async function remove(id) {
    await supabase.from('workout_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return { templates, save, remove }
}

// ── Weight sparkline ───────────────────────────────────────────────────────
function WeightChart({ logs }) {
  if (logs.length < 2) return null
  const sorted = [...logs].sort((a,b) => a.date.localeCompare(b.date))
  const vals   = sorted.map(l => +l.weight)
  const min    = Math.min(...vals), max = Math.max(...vals)
  const range  = max - min || 1
  const w = 300, h = 60
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 10) - 5
    return `${x},${y}`
  }).join(' ')
  const latest = vals[vals.length - 1]
  const prev   = vals[vals.length - 2]
  const diff   = latest - prev
  return (
    <div>
      <div style={{ display:'flex', alignItems:'baseline', gap:10, marginBottom:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:500, color:'#f5c842' }}>{latest}</span>
        <span style={{ fontSize:13, color: diff <= 0 ? '#5dd4a6' : '#f07a62', fontWeight:600 }}>{diff > 0 ? '+' : ''}{diff.toFixed(1)}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
        <polyline points={pts} fill="none" stroke="#f5c842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"/>
        <polyline points={`0,${h} ${pts} ${w},${h}`} fill="#f5c842" fillOpacity="0.08" stroke="none"/>
        <circle cx={+pts.split(' ').pop().split(',')[0]} cy={+pts.split(' ').pop().split(',')[1]} r="4" fill="#f5c842"/>
      </svg>
    </div>
  )
}

export default function Workout() {
  const { sessions, add, remove, sessionsThisWeek } = useWorkouts()
  const { profile } = useProfile()
  const weightUnit  = profile?.weight_unit || 'kg'
  const { logs: weightLogs, add: addWeight, remove: removeWeight } = useWeightLogs()
  const { templates, save: saveTemplate, remove: removeTemplate } = useTemplates()

  const [sessionName, setSessionName]       = useState('')
  const [sessionType, setSessionType]       = useState('Strength')
  const [sessionDate, setSessionDate]       = useState(format(new Date(), 'yyyy-MM-dd'))
  const [sessionDuration, setSessionDuration] = useState('')
  const [sessionNotes, setSessionNotes]     = useState('')
  const [exForm, setExForm]   = useState({ name:'', sets:'', reps:'', weight:'' })
  const [savedExs, setSavedExs] = useState([])
  const [saving, setSaving]   = useState(false)
  const [weightForm, setWeightForm] = useState({ weight:'', date: format(new Date(), 'yyyy-MM-dd'), notes:'' })
  const [activeTab, setActiveTab] = useState('log')
  const setEx = k => e => setExForm(f => ({ ...f, [k]: e.target.value }))

  function saveEx() {
    if (!exForm.name.trim()) return
    setSavedExs(prev => [...prev, { ...exForm, id: Date.now() }])
    setExForm({ name:'', sets:'', reps:'', weight:'' })
  }

  async function handleLog() {
    if (!sessionName.trim()) return
    setSaving(true)
    const volume = savedExs.reduce((s,e) => s + (+e.sets||0)*(+e.reps||0)*(+e.weight||0), 0)
    await add({ session: { name:sessionName, type:sessionType, duration_mins:+sessionDuration||0, total_volume:volume, notes:sessionNotes, date:sessionDate }, exercises: savedExs.map((e,i) => ({ name:e.name, sets:+e.sets||0, reps:+e.reps||0, weight:+e.weight||0, sort_order:i })) })
    setSessionName(''); setSessionType('Strength'); setSessionDate(format(new Date(),'yyyy-MM-dd')); setSessionDuration(''); setSessionNotes(''); setSavedExs([])
    setSaving(false)
  }

  async function saveAsTemplate() {
    if (!sessionName.trim() || savedExs.length === 0) return
    await saveTemplate({ name: sessionName, type: sessionType, exercises: savedExs })
  }

  function loadTemplate(t) {
    setSessionName(t.name); setSessionType(t.type)
    setSavedExs((t.exercises || []).map(e => ({ ...e, id: Date.now() + Math.random() })))
    setActiveTab('log')
  }

  // Workout streak
  const workoutStreak = (() => {
    if (!sessions.length) return 0
    const dates = new Set(sessions.map(s => s.date))
    let count = 0; let check = new Date()
    for (let i = 0; i < 365; i++) {
      const key = format(check, 'yyyy-MM-dd')
      if (dates.has(key)) { count++; check = subDays(check, 1) }
      else if (count > 0) break
      else check = subDays(check, 1)
    }
    return count
  })()

  const latestWeight = weightLogs[0]?.weight

  return (
    <div className="fade-up">
      <SectionHeader title="Workout" sub="Log sessions, track weight & save templates" accentColor="#a88ef0" />

      <Grid cols={3} style={{ marginBottom:16 }}>
        <StatCard label="Total Sessions" value={sessions.length}      color="#a88ef0" />
        <StatCard label="This Week"      value={sessionsThisWeek}     color="#6a96f0" />
        <StatCard label="Workout Streak" value={workoutStreak + ' 🔥'} color="#5dd4a6" sub="days in a row" />
      </Grid>

      {/* Tab switcher */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:3, gap:2, marginBottom:14 }}>
        {[['log','Log Session'],['templates','Templates'],['weight','Body Weight']].map(([t,l]) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex:1, padding:'8px', borderRadius:10, border:'none', background:activeTab===t?'rgba(245,200,66,0.15)':'transparent', color:activeTab===t?'#f5c842':'rgba(255,255,255,0.40)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s', border: activeTab===t?'1px solid rgba(245,200,66,0.25)':'1px solid transparent' }}>{l}</button>
        ))}
      </div>

      {/* LOG TAB */}
      {activeTab === 'log' && (
        <>
          <Card style={{ marginBottom:12 }}>
            <CardTitle>Session Info</CardTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', gap:8 }}>
                <input value={sessionName} onChange={e=>setSessionName(e.target.value)} placeholder="Session name (e.g. Push Day)" style={{ flex:2 }} />
                <select value={sessionType} onChange={e=>setSessionType(e.target.value)} style={{ flex:1 }}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700 }}>Date</label>
                  <input type="date" value={sessionDate} onChange={e=>setSessionDate(e.target.value)} style={{ colorScheme:'dark' }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700 }}>Duration (min)</label>
                  <input type="number" value={sessionDuration} onChange={e=>setSessionDuration(e.target.value)} placeholder="e.g. 60" min={1} />
                </div>
              </div>
              <textarea value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)} placeholder="Session notes (optional)" style={{ minHeight:44 }} />
            </div>
          </Card>

          <Card style={{ marginBottom:12 }}>
            <CardTitle>Add Exercise</CardTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 65px 65px 100px auto', gap:8, alignItems:'end', marginBottom:12 }}>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Exercise</label>
                <input value={exForm.name} onChange={setEx('name')} placeholder="e.g. Bench Press" onKeyDown={e=>e.key==='Enter'&&saveEx()} />
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Sets</label>
                <input type="number" value={exForm.sets} onChange={setEx('sets')} min={0} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Reps</label>
                <input type="number" value={exForm.reps} onChange={setEx('reps')} min={0} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(255,255,255,0.35)', display:'block', marginBottom:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{weightUnit}</label>
                <input type="number" value={exForm.weight} onChange={setEx('weight')} min={0} step="0.5" placeholder="0" />
              </div>
              <Button variant="teal" onClick={saveEx} style={{ alignSelf:'end' }}>Save</Button>
            </div>

            {savedExs.length > 0 && (
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:12 }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:8 }}>Saved Exercises ({savedExs.length})</div>
                {savedExs.map((ex,i) => (
                  <div key={ex.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:10, marginBottom:6, border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'rgba(255,255,255,0.40)', flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{ex.name}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:1 }}>{ex.sets||0} sets × {ex.reps||0} reps{ex.weight?' @ '+ex.weight+weightUnit:''}</div>
                    </div>
                    <button onClick={() => setSavedExs(p=>p.filter(e=>e.id!==ex.id))} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.28)', fontSize:18, cursor:'pointer' }}>x</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div style={{ display:'flex', gap:8, marginBottom:20 }}>
            <Button variant="gold" fullWidth loading={saving} onClick={handleLog} disabled={!sessionName.trim()}>
              {savedExs.length > 0 ? `Log Session (${savedExs.length} exercise${savedExs.length>1?'s':''})` : 'Log Session'}
            </Button>
            {savedExs.length > 0 && sessionName.trim() && (
              <Button onClick={saveAsTemplate} style={{ flexShrink:0 }}>Save as Template</Button>
            )}
          </div>

          <Card>
            <CardTitle>Session History</CardTitle>
            {sessions.length === 0
              ? <EmptyState icon="🏋️" message="No sessions logged yet." />
              : sessions.map(s => (
                <div key={s.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, marginBottom:8, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:'rgba(138,110,216,0.18)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#a88ef0', flexShrink:0 }}>{s.type[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{s.name}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:1 }}>{s.type} · {s.duration_mins ? s.duration_mins+'min' : 'Duration not set'}</div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'#f5c842' }}>{s.date}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{(s.exercises||[]).length} exercises</div>
                    </div>
                    <button onClick={() => remove(s.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.25)', fontSize:18, cursor:'pointer' }}
                      onMouseEnter={e=>e.target.style.color='#f07a62'} onMouseLeave={e=>e.target.style.color='rgba(255,255,255,0.25)'}>x</button>
                  </div>
                  {(s.exercises||[]).length > 0 && (
                    <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'8px 14px 10px', display:'flex', flexWrap:'wrap', gap:6 }}>
                      {(s.exercises||[]).map((ex,i) => (
                        <div key={i} style={{ background:'rgba(255,255,255,0.06)', borderRadius:8, padding:'4px 10px', fontSize:12 }}>
                          <span style={{ color:'rgba(255,255,255,0.80)', fontWeight:600 }}>{ex.name}</span>
                          <span style={{ color:'rgba(255,255,255,0.38)', marginLeft:6 }}>{ex.sets}×{ex.reps}{ex.weight?' @ '+ex.weight+weightUnit:''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            }
          </Card>
        </>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <Card>
          <CardTitle>Saved Templates</CardTitle>
          {templates.length === 0
            ? <div style={{ textAlign:'center', padding:'32px 20px', color:'rgba(255,255,255,0.30)' }}>
                <div style={{ fontSize:28, marginBottom:8 }}>📋</div>
                <div style={{ fontSize:13 }}>No templates yet. Log a session and tap "Save as Template" to create one.</div>
              </div>
            : templates.map(t => (
              <div key={t.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'12px 14px', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700 }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{t.type} · {(t.exercises||[]).length} exercises</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <Button size="sm" variant="gold" onClick={() => loadTemplate(t)}>Load</Button>
                    <button onClick={() => removeTemplate(t.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.28)', fontSize:18, cursor:'pointer', padding:'4px 6px' }}>x</button>
                  </div>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {(t.exercises||[]).map((ex,i) => (
                    <div key={i} style={{ background:'rgba(255,255,255,0.06)', borderRadius:6, padding:'3px 8px', fontSize:11, color:'rgba(255,255,255,0.60)' }}>
                      {ex.name} {ex.sets}×{ex.reps}
                    </div>
                  ))}
                </div>
              </div>
            ))
          }
        </Card>
      )}

      {/* BODY WEIGHT TAB */}
      {activeTab === 'weight' && (
        <Grid cols={2}>
          <Card>
            <CardTitle>Log Weight</CardTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700 }}>Weight ({weightUnit})</label>
                <input type="number" value={weightForm.weight} onChange={e=>setWeightForm(f=>({...f,weight:e.target.value}))} placeholder={'e.g. 75'} min={0} step="0.1" />
              </div>
              <div>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700 }}>Date</label>
                <input type="date" value={weightForm.date} onChange={e=>setWeightForm(f=>({...f,date:e.target.value}))} style={{ colorScheme:'dark' }} />
              </div>
              <Button variant="gold" onClick={async () => { if (weightForm.weight) { await addWeight({ weight:+weightForm.weight, date:weightForm.date, notes:weightForm.notes }); setWeightForm(f=>({...f,weight:''})) } }}>Log Weight</Button>
            </div>
          </Card>

          <Card>
            <CardTitle>Trend</CardTitle>
            {weightLogs.length === 0
              ? <EmptyState icon="⚖️" message="No weight logs yet" />
              : <>
                <WeightChart logs={weightLogs.slice(0,14).reverse()} />
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.30)', marginTop:8 }}>Last 14 entries in {weightUnit}</div>
              </>
            }
          </Card>

          <Card style={{ gridColumn:'1/-1' }}>
            <CardTitle>Weight History</CardTitle>
            {weightLogs.length === 0
              ? <EmptyState icon="⚖️" message="No entries yet" />
              : weightLogs.slice(0,20).map(l => (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:500, color:'#f5c842', width:60 }}>{l.weight}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', flex:1 }}>{l.date}{l.notes?' · '+l.notes:''}</div>
                  <button onClick={() => removeWeight(l.id)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.25)', fontSize:16, cursor:'pointer' }}>x</button>
                </div>
              ))
            }
          </Card>
        </Grid>
      )}
    </div>
  )
}
