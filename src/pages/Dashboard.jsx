import { useState, useEffect, useRef } from 'react'
import { format, subDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTransactions, useFoodLogs, useWellness, useWorkouts, useJournal, useProfile } from '@/hooks/useData'
import { Card, CardTitle, StatCard, Grid, Button, EmptyState, AnimatedNumber } from '@/components/shared/UI'
import { useConfetti } from '@/components/shared/Confetti'
import { useToast } from '@/components/shared/Toast'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FM = "'JetBrains Mono',monospace"
const FS = "'DM Serif Display',Georgia,serif"
const SYMBOLS = { EUR:'€', USD:'$', JPY:'¥' }

// ── Weather widget ──────────────────────────────────────────────────────────
function WeatherCard() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation_probability&timezone=auto&forecast_days=1`
          const r    = await fetch(url)
          const d    = await r.json()
          const cur  = d.current
          // Reverse geocode with a free API
          const geo  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          const gd   = await geo.json()
          const city = gd.address?.city || gd.address?.town || gd.address?.village || gd.address?.county || 'Your location'
          setWeather({
            temp:       Math.round(cur.temperature_2m),
            feels:      Math.round(cur.apparent_temperature),
            code:       cur.weather_code,
            wind:       Math.round(cur.wind_speed_10m),
            humidity:   cur.relative_humidity_2m,
            city,
            hourly: {
              times: d.hourly.time.slice(0,12),
              temps: d.hourly.temperature_2m.slice(0,12),
              precip: d.hourly.precipitation_probability.slice(0,12),
            }
          })
        } catch { setError(true) }
        setLoading(false)
      },
      () => { setError(true); setLoading(false) }
    )
  }, [])

  function weatherIcon(code) {
    if (code === 0) return '☀️'
    if (code <= 3)  return '⛅️'
    if (code <= 48) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 77) return '❄️'
    if (code <= 82) return '🌦️'
    if (code <= 99) return '⛈️'
    return '🌤️'
  }

  function weatherDesc(code) {
    if (code === 0) return 'Clear sky'
    if (code <= 3)  return 'Partly cloudy'
    if (code <= 48) return 'Foggy'
    if (code <= 55) return 'Drizzle'
    if (code <= 67) return 'Rainy'
    if (code <= 77) return 'Snowy'
    if (code <= 82) return 'Rain showers'
    return 'Thunderstorm'
  }

  if (loading) return (
    <Card style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:110 }}>
      <div style={{ width:18, height:18, border:'2px solid rgba(245,200,66,0.2)', borderTopColor:'#f5c842', borderRadius:'50%', animation:'spin 0.65s linear infinite' }} />
    </Card>
  )

  if (error) return (
    <Card>
      <CardTitle>Weather</CardTitle>
      <div style={{ fontSize:12, color:'rgba(255,255,255,0.32)', textAlign:'center', padding:'8px 0' }}>
        Enable location to see weather
      </div>
    </Card>
  )

  const maxPrecip = weather?.hourly ? Math.max(...weather.hourly.precip, 1) : 1
  const maxTemp   = weather?.hourly ? Math.max(...weather.hourly.temps) : 1
  const minTemp   = weather?.hourly ? Math.min(...weather.hourly.temps) : 0
  const tempRange = maxTemp - minTemp || 1

  return (
    <Card accent="#6a96f0">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:4 }}>{weather.city}</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontFamily:FM, fontSize:36, fontWeight:500, color:'#fff', lineHeight:1 }}>{weather.temp}°</span>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.45)' }}>feels {weather.feels}°</span>
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginTop:3 }}>{weatherDesc(weather.code)}</div>
        </div>
        <div style={{ fontSize:52, lineHeight:1 }}>{weatherIcon(weather.code)}</div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:12 }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'flex', alignItems:'center', gap:4 }}>
          <span>💨</span> {weather.wind} km/h
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'flex', alignItems:'center', gap:4 }}>
          <span>💧</span> {weather.humidity}%
        </div>
      </div>

      {/* Hourly temp chart */}
      {weather.hourly && (
        <div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Hourly</div>
          <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:40 }}>
            {weather.hourly.temps.map((t,i) => {
              const pct = ((t - minTemp) / tempRange)
              const hour = new Date(weather.hourly.times[i]).getHours()
              const now  = new Date().getHours()
              const isNow = hour === now
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ width:'100%', borderRadius:'3px 3px 0 0', height:(pct*32+8)+'px', background:isNow?'#6a96f0':'rgba(106,150,240,0.35)', transition:'height 0.4s' }} />
                  <span style={{ fontSize:8, color:isNow?'#6a96f0':'rgba(255,255,255,0.25)', fontWeight:isNow?700:400 }}>{hour}h</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── AI morning summary ──────────────────────────────────────────────────────
function AISummaryCard({ profile, transactions, todayLogs, totalCalories, calGoal, completedToday, goals, workoutStreak, journalStreak }) {
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Auto-generate on first load today
  useEffect(() => {
    const key = 'folio_ai_summary_' + format(new Date(), 'yyyy-MM-dd')
    const cached = localStorage.getItem(key)
    if (cached) { setSummary(cached); return }
  }, [])

  async function generate() {
    setLoading(true)
    const key = 'folio_ai_summary_' + format(new Date(), 'yyyy-MM-dd')
    const name    = profile?.full_name?.split(' ')[0] || 'there'
    const sym     = SYMBOLS[profile?.currency] || '€'
    const todaySpend = transactions.filter(t => t.date === format(new Date(),'yyyy-MM-dd') && t.type==='expense').reduce((s,t)=>s+(+t.amount||0),0)

    const prompt = `You are a warm, concise personal assistant inside a wellness app. Write a 2-sentence morning greeting for ${name}.

Today's data:
- Calories logged today: ${totalCalories} of ${calGoal} goal
- Today's spending: ${sym}${Math.round(todaySpend)}
- Wellness goals completed today: ${completedToday} of ${goals.length}
- Current workout streak: ${workoutStreak} days
- Journal streak: ${journalStreak} days

Be warm, specific, and encouraging. Reference actual numbers. Max 2 sentences. Don't start with "Good morning".`

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:120, messages:[{role:'user',content:prompt}] })
      })
      const d = await r.json()
      const text = d.content?.[0]?.text || ''
      if (text) {
        setSummary(text)
        localStorage.setItem(key, text)
      }
    } catch {
      const fallback = `You've hit ${completedToday} of ${goals.length} goals today and are on a ${workoutStreak}-day workout streak — keep it up!`
      setSummary(fallback)
      localStorage.setItem(key, fallback)
    }
    setLoading(false)
  }

  if (dismissed) return null

  return (
    <div style={{ background:'rgba(138,110,216,0.09)', border:'1px solid rgba(138,110,216,0.18)', borderRadius:16, padding:'14px 16px', marginBottom:16, backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', animation:'fadeUp 0.35s ease', position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:summary?10:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#a88ef0', boxShadow:'0 0 8px #a88ef0', animation:'gp 3s ease-in-out infinite' }} />
          <span style={{ fontSize:11, fontWeight:700, color:'#a88ef0', letterSpacing:'0.07em', textTransform:'uppercase' }}>AI Summary</span>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {!summary && (
            <button onClick={generate} disabled={loading} style={{ background:'rgba(138,110,216,0.16)', border:'1px solid rgba(138,110,216,0.28)', borderRadius:8, color:'#a88ef0', fontSize:12, fontWeight:700, padding:'5px 12px', cursor:loading?'not-allowed':'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:5 }}>
              {loading ? <><div style={{ width:11,height:11,border:'2px solid rgba(168,142,240,0.3)',borderTopColor:'#a88ef0',borderRadius:'50%',animation:'spin 0.6s linear infinite' }} /> Thinking...</> : '✦ Generate'}
            </button>
          )}
          <button onClick={() => setDismissed(true)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.25)', fontSize:18, cursor:'pointer', lineHeight:1, padding:'2px 4px' }}>x</button>
        </div>
      </div>
      {summary && (
        <div style={{ fontSize:14, color:'rgba(255,255,255,0.80)', lineHeight:1.7, fontStyle:'italic' }}>"{summary}"</div>
      )}
    </div>
  )
}

// ── Animated check ──────────────────────────────────────────────────────────
function CheckGoal({ goal, checked, onToggle }) {
  const ref = useRef()
  const { fromElement } = useConfetti()

  function handleClick() {
    if (!checked) {
      // Animate the checkbox
      if (ref.current) {
        ref.current.style.transform = 'scale(1.35)'
        setTimeout(() => { if(ref.current) ref.current.style.transform = 'scale(1)' }, 200)
        fromElement(ref.current, 18)
      }
    }
    onToggle(goal.id)
  }

  return (
    <div onClick={handleClick} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.055)', cursor:'pointer' }}
      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <div ref={ref} style={{
        width:22, height:22, borderRadius:'50%', flexShrink:0,
        border:'1.5px solid '+(checked?'#3db88a':'rgba(255,255,255,0.18)'),
        background:checked?'rgba(61,184,138,0.20)':'transparent',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:12, color:'#5dd4a6',
        transition:'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow:checked?'0 0 10px rgba(61,184,138,0.35)':'none',
      }}>
        {checked ? '✓' : ''}
      </div>
      <span style={{ fontSize:14, flex:1, color:checked?'rgba(255,255,255,0.38)':'rgba(255,255,255,0.85)', textDecoration:checked?'line-through':'none', transition:'all 0.2s' }}>{goal.name}</span>
      <span style={{ fontSize:18 }}>{goal.icon}</span>
    </div>
  )
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const { profile } = useProfile()
  const { transactions, balance, income, expenses } = useTransactions()
  const { totalCalories, calGoal, todayLogs }        = useFoodLogs()
  const { goals, isCompleted, completedToday, toggle } = useWellness()
  const { sessions, sessionsThisWeek }               = useWorkouts()
  const { entries, streak: journalStreak }           = useJournal()
  const toast   = useToast()
  const { fromCenter } = useConfetti()

  const sym = SYMBOLS[profile?.currency] || '€'
  const fmt = n => sym + Math.abs(+n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})
  const calPct = Math.min((totalCalories/calGoal)*100,100)

  const weeklySpend = Array.from({length:7},(_,i)=>{
    const day = format(subDays(new Date(),6-i),'yyyy-MM-dd')
    return transactions.filter(t=>t.date===day&&t.type==='expense').reduce((s,t)=>s+(+t.amount||0),0)
  })

  const workoutStreak = (() => {
    if (!sessions.length) return 0
    const dates = new Set(sessions.map(s=>s.date))
    let count=0; let check=new Date()
    for(let i=0;i<365;i++){
      const key=format(check,'yyyy-MM-dd')
      if(dates.has(key)){count++;check=subDays(check,1)}
      else if(count>0) break
      else check=subDays(check,1)
    }
    return count
  })()

  // Milestone confetti
  useEffect(() => {
    const milestones = [7,30,100]
    if (milestones.includes(workoutStreak) || milestones.includes(journalStreak)) {
      setTimeout(() => fromCenter(70), 300)
    }
  }, [workoutStreak, journalStreak])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
  const name = profile?.full_name?.split(' ')[0] || ''

  const wMax = Math.max(...weeklySpend, 1)

  return (
    <div className="fade-up">
      {/* Greeting */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <h1 style={{ fontFamily:FS, fontSize:30, fontWeight:400, color:'#fff', marginBottom:3 }}>
            {greeting()}{name ? `, ${name}` : ''} ✦
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.36)' }}>{format(new Date(),'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button onClick={()=>navigate('/insights')} style={{ background:'rgba(138,110,216,0.12)', border:'1px solid rgba(138,110,216,0.25)', borderRadius:10, color:'#a88ef0', fontSize:12, fontWeight:700, padding:'8px 14px', cursor:'pointer', fontFamily:F, flexShrink:0, transition:'all 0.18s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(138,110,216,0.22)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(138,110,216,0.12)'}>
          ✦ Insights
        </button>
      </div>

      {/* AI Summary */}
      <AISummaryCard
        profile={profile} transactions={transactions} todayLogs={todayLogs}
        totalCalories={totalCalories} calGoal={calGoal}
        completedToday={completedToday} goals={goals}
        workoutStreak={workoutStreak} journalStreak={journalStreak}
      />

      {/* Stats */}
      <Grid cols={4} style={{ marginBottom:14 }}>
        <StatCard label="Balance"     value={fmt(balance)}                        color="#f5c842" />
        <StatCard label="Calories"    value={totalCalories}                       color="#f07a62" sub={'of '+calGoal+' kcal'} accent={calPct} />
        <StatCard label="Goals Today" value={completedToday+'/'+goals.length}     color="#5dd4a6" />
        <StatCard label="Streaks 🔥"  value={Math.max(workoutStreak,journalStreak)} color="#6a96f0" sub="days" />
      </Grid>

      <Grid cols={3} style={{ marginBottom:14 }}>
        {/* Weekly spend bar chart */}
        <Card>
          <CardTitle>Weekly Spending</CardTitle>
          <div style={{ fontFamily:FM, fontSize:22, color:'#f5c842', marginBottom:10 }}>
            <AnimatedNumber value={weeklySpend.reduce((a,b)=>a+b,0)} prefix={sym} decimals={0} color="#f5c842" />
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:5, height:52 }}>
            {weeklySpend.map((v,i)=>{
              const isToday = i===6
              const h = Math.max((v/wMax)*44,3)
              return (
                <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ width:'100%', height:h+'px', borderRadius:'3px 3px 0 0', background:isToday?'#f5c842':'rgba(245,200,66,0.28)', transition:'height 0.5s ease' }} />
                  <span style={{ fontSize:9, color:isToday?'#f5c842':'rgba(255,255,255,0.25)', fontWeight:isToday?700:400 }}>
                    {['M','T','W','T','F','S','S'][i]}
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Calorie ring */}
        <Card>
          <CardTitle>Today's Calories</CardTitle>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink:0 }}>
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6"/>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#f07a62" strokeWidth="6"
                strokeDasharray={2*Math.PI*26}
                strokeDashoffset={2*Math.PI*26*(1-calPct/100)}
                strokeLinecap="round" transform="rotate(-90 32 32)"
                style={{ transition:'stroke-dashoffset 1s ease', filter:'drop-shadow(0 0 4px rgba(240,122,98,0.5))' }}/>
              <text x="32" y="36" textAnchor="middle" fontSize="11" fontWeight="700" fill="white" fontFamily="'Plus Jakarta Sans',sans-serif">
                {Math.round(calPct)}%
              </text>
            </svg>
            <div>
              <div style={{ fontFamily:FM, fontSize:20, color:'#f07a62' }}>{totalCalories}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.36)', marginTop:2 }}>of {calGoal} kcal</div>
            </div>
          </div>
        </Card>

        {/* Weather */}
        <WeatherCard />
      </Grid>

      <Grid cols={2} style={{ marginBottom:14 }}>
        {/* Wellness goals with animated checkboxes */}
        <Card>
          <CardTitle>Today's Goals</CardTitle>
          {goals.length === 0
            ? <EmptyState icon="🎯" message="Add goals in the Wellness tab" />
            : goals.slice(0,5).map(g => (
              <CheckGoal key={g.id} goal={g} checked={isCompleted(g.id)} onToggle={toggle} />
            ))
          }
          <button onClick={()=>navigate('/wellness')} style={{ marginTop:10, width:'100%', padding:'7px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, color:'rgba(255,255,255,0.45)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F, transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.09)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}>
            Manage Goals →
          </button>
        </Card>

        {/* Streaks */}
        <Card>
          <CardTitle>Streaks</CardTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[
              { label:'Journal',  value:journalStreak,  color:'#6a96f0', icon:'✍️', max:30 },
              { label:'Workout',  value:workoutStreak,  color:'#a88ef0', icon:'🏋️', max:30 },
              { label:'Wellness', value:completedToday, color:'#5dd4a6', icon:'🎯', max:goals.length||1 },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20, width:28, textAlign:'center' }}>{s.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{s.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.value}{s.max&&s.label!=='Wellness'?' days':'/'+(s.max||1)}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:5, overflow:'hidden' }}>
                    <div style={{ width:Math.min((s.value/(s.max||1))*100,100)+'%', height:'100%', background:s.color, borderRadius:99, transition:'width 0.7s ease', boxShadow:`0 0 6px ${s.color}60` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(workoutStreak >= 7 || journalStreak >= 7) && (
            <div style={{ marginTop:12, padding:'8px 12px', background:'rgba(245,200,66,0.09)', border:'1px solid rgba(245,200,66,0.18)', borderRadius:10, fontSize:12, color:'#f5c842', textAlign:'center', fontWeight:600 }}>
              🏆 {workoutStreak >= 7 ? 'Workout' : 'Journal'} streak milestone! Keep going!
            </div>
          )}
        </Card>
      </Grid>

      {/* Quick actions */}
      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['+ Transaction','/finance','#f5c842'],
            ['+ Food','/nutrition','#f07a62'],
            ['✓ Goals','/wellness','#5dd4a6'],
            ['+ Workout','/workout','#a88ef0'],
            ['✍ Journal','/journal','#6a96f0'],
            ['📅 Schedule','/schedule','#3db88a'],
            ['✦ Insights','/insights','#a88ef0'],
          ].map(([label,path,color]) => (
            <button key={path} onClick={()=>navigate(path)} style={{
              padding:'8px 14px', borderRadius:9, border:'1px solid rgba(255,255,255,0.09)',
              background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.70)',
              fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:F,
              transition:'all 0.18s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=color+'55';e.currentTarget.style.color=color;e.currentTarget.style.background=color+'12'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';e.currentTarget.style.color='rgba(255,255,255,0.70)';e.currentTarget.style.background='rgba(255,255,255,0.05)'}}>
              {label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
