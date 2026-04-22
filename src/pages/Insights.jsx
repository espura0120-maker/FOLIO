import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, SectionHeader, Grid, Spinner, StatCard } from '@/components/shared/UI'
import { MoodGraph } from '@/components/shared/MoodGraph'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FM = "'JetBrains Mono',monospace"

function TrendLine({ data, color = '#f5c842', height = 48 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')
  const gradId = 'tg' + color.replace('#', '')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gradId})`} stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r="3.5" fill={color}/>
    </svg>
  )
}

function CorrelationCard({ title, value, description, color, trend }) {
  return (
    <Card accent={color}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', flex:1, marginRight:8 }}>{title}</div>
        <div style={{ fontFamily:FM, fontSize:20, fontWeight:500, color, flexShrink:0 }}>{value}</div>
      </div>
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:trend ? 12 : 0 }}>{description}</div>
      {trend && <TrendLine data={trend} color={color} />}
    </Card>
  )
}

export default function Insights() {
  const { user } = useAuth()
  const [loading, setLoading]     = useState(true)
  const [data, setData]           = useState(null)
  const [rawData, setRawData]     = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const days30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')

    const [tx, food, wellness, sessions, journal] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', days30),
      supabase.from('food_logs').select('*').gte('date', days30),
      supabase.from('wellness_checkins').select('*').gte('date', days30),
      supabase.from('workout_sessions').select('*').gte('date', days30),
      supabase.from('journal_entries').select('id,mood,date,created_at').gte('date', days30),
    ])

    const txData      = tx.data      || []
    const foodData    = food.data    || []
    const wellData    = wellness.data|| []
    const sessData    = sessions.data|| []
    const journalData = journal.data || []

    // Store raw for MoodGraph
    setRawData({ txData, foodData, wellData, sessData, journalData })

    const days = Array.from({ length:30 }, (_, i) => format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'))

    const dailySpend    = days.map(d => txData.filter(t => t.date===d && t.type==='expense').reduce((s,t) => s+(+t.amount||0), 0))
    const dailyCalories = days.map(d => foodData.filter(f => f.date===d).reduce((s,f) => s+(+f.calories||0), 0))
    const dailyWorkout  = days.map(d => sessData.some(s => s.date===d) ? 1 : 0)
    const dailyWellness = days.map(d => wellData.filter(w => w.date===d).length)

    const workoutDays    = days.filter((_, i) => dailyWorkout[i] === 1)
    const noWorkoutDays  = days.filter((_, i) => dailyWorkout[i] === 0)
    const avgCalWorkout  = workoutDays.map(d => foodData.filter(f=>f.date===d).reduce((s,f)=>s+(+f.calories||0),0))
    const avgCalNoWkt    = noWorkoutDays.map(d => foodData.filter(f=>f.date===d).reduce((s,f)=>s+(+f.calories||0),0))
    const calOnWorkout   = avgCalWorkout.length ? Math.round(avgCalWorkout.reduce((a,b)=>a+b,0)/avgCalWorkout.length) : 0
    const calOnRest      = avgCalNoWkt.length   ? Math.round(avgCalNoWkt.reduce((a,b)=>a+b,0)/avgCalNoWkt.length)   : 0

    const totalSpend    = txData.filter(t=>t.type==='expense').reduce((s,t)=>s+(+t.amount||0),0)
    const avgDailySpend = totalSpend / days.length
    const workoutCount  = sessData.length
    const journalCount  = journalData.length
    const goalsHit      = wellData.length

    const spendByDay  = [0,1,2,3,4,5,6].map(dow => {
      const dowTx = txData.filter(t => t.type==='expense' && new Date(t.date).getDay()===dow)
      return dowTx.reduce((s,t)=>s+(+t.amount||0),0)
    })
    const DAYS_LABEL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const maxDow = spendByDay.indexOf(Math.max(...spendByDay))

    // Habit streaks from habits table
    const { data: habitChecks } = await supabase.from('habit_checks').select('date').gte('date', days30)
    const habitDays = (habitChecks || []).length

    // Daily log completion
    const { data: dlEntries } = await supabase.from('daily_log_entries').select('date,completed,type').gte('date', days30)
    const dlCompleted = (dlEntries || []).filter(e => e.completed).length
    const dlTotal     = (dlEntries || []).filter(e => e.type==='task'||e.type==='priority').length
    const dlRate      = dlTotal > 0 ? Math.round(dlCompleted/dlTotal*100) : 0

    setData({
      dailySpend, dailyCalories, dailyWorkout, dailyWellness,
      totalSpend, avgDailySpend, workoutCount, journalCount, goalsHit,
      calOnWorkout, calOnRest, maxSpendDay: DAYS_LABEL[maxDow],
      habitDays, dlRate,
    })
    setLoading(false)
  }

  async function generateAiInsight() {
    if (!data) return
    setAiLoading(true)
    const prompt = `You are a warm personal wellness coach. Based on this 30-day summary, write 3 concise, insightful sentences. Reference specific numbers. End with one actionable suggestion.

Data:
- Total spending: €${Math.round(data.totalSpend)} (avg €${Math.round(data.avgDailySpend)}/day, highest day: ${data.maxSpendDay})
- Workout sessions: ${data.workoutCount} (${Math.round(data.workoutCount/30*7*10)/10}/week avg)
- Journal entries: ${data.journalCount}
- Wellness goals completed: ${data.goalsHit} check-ins
- Habit tracker: ${data.habitDays} habit completions
- Daily log task completion rate: ${data.dlRate}%
- Avg calories on workout days: ${data.calOnWorkout} kcal vs rest days: ${data.calOnRest} kcal

Be direct, warm and specific. Max 3 sentences + 1 tip.`

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:300, messages:[{ role:'user', content:prompt }] })
      })
      const d = await r.json()
      setAiInsight(d.content?.[0]?.text || 'Unable to generate insight right now.')
    } catch {
      setAiInsight('Keep going — every log, workout, and journal entry is building a clearer picture of your habits.')
    }
    setAiLoading(false)
  }

  const weekSpend = (data?.dailySpend || []).slice(-7)
  const weekCal   = (data?.dailyCalories || []).slice(-7)

  return (
    <div className="fade-up">
      <SectionHeader title="Insights" sub="30-day patterns across all your data" accent="#a88ef0" />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32} /></div>
      ) : (
        <>
          {/* AI Summary */}
          <Card style={{ marginBottom:16 }} accent="#a88ef0">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <CardTitle>AI Summary</CardTitle>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)' }}>Powered by Claude · Last 30 days</div>
              </div>
              <button onClick={generateAiInsight} disabled={aiLoading} style={{ background:'rgba(138,110,216,0.16)', border:'1px solid rgba(138,110,216,0.30)', borderRadius:10, color:'#a88ef0', fontSize:12, fontWeight:700, padding:'7px 14px', cursor:aiLoading?'not-allowed':'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:6, transition:'all 0.18s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(138,110,216,0.26)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(138,110,216,0.16)'}>
                {aiLoading ? <><div style={{ width:12,height:12,border:'2px solid rgba(168,142,240,0.3)',borderTopColor:'#a88ef0',borderRadius:'50%',animation:'spin 0.6s linear infinite' }} /> Analysing...</> : '✦ Generate Insight'}
              </button>
            </div>
            {aiInsight ? (
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.82)', lineHeight:1.75, padding:'12px 14px', background:'rgba(138,110,216,0.08)', borderRadius:12, border:'1px solid rgba(138,110,216,0.15)', fontStyle:'italic' }}>
                "{aiInsight}"
              </div>
            ) : (
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.32)', textAlign:'center', padding:'16px 0' }}>
                Tap Generate Insight for a personalised 30-day analysis ✦
              </div>
            )}
          </Card>

          {/* Stat row */}
          <Grid cols={4} style={{ marginBottom:14 }}>
            <StatCard label="Workouts"      value={data.workoutCount}                  color="#a88ef0" />
            <StatCard label="Journal Days"  value={data.journalCount}                  color="#f5c842" />
            <StatCard label="Goals Hit"     value={data.goalsHit}                      color="#5dd4a6" />
            <StatCard label="Task Complete" value={data.dlRate + '%'}                  color="#6a96f0" />
          </Grid>

          {/* Mood graph — new feature */}
          <div style={{ marginBottom:14 }}>
            <MoodGraph
              journalEntries={rawData?.journalData || []}
              workoutSessions={rawData?.sessData   || []}
              transactions={rawData?.txData        || []}
              days={30}
            />
          </div>

          {/* Trend cards */}
          <Grid cols={2} style={{ marginBottom:14 }}>
            <CorrelationCard
              title="Spending this week"
              value={'€' + Math.round(weekSpend.reduce((a,b)=>a+b,0))}
              description={`Your highest spending day is ${data.maxSpendDay}. ${data.avgDailySpend > 30 ? 'Consider setting stricter daily limits.' : 'Your daily spending looks healthy.'}`}
              color="#f5c842"
              trend={weekSpend}
            />
            <CorrelationCard
              title="Calories this week"
              value={Math.round(weekCal.reduce((a,b)=>a+b,0) / 7 || 0) + ' avg'}
              description={data.calOnWorkout && data.calOnRest
                ? `You eat ${Math.abs(data.calOnWorkout - data.calOnRest)} kcal ${data.calOnWorkout > data.calOnRest ? 'more' : 'less'} on workout days. ${data.calOnWorkout > data.calOnRest ? 'Good — fuelling your sessions.' : 'Consider eating more on active days.'}`
                : 'Log more food to see patterns here.'}
              color="#f07a62"
              trend={weekCal}
            />
          </Grid>

          {/* Consistency grids */}
          <Grid cols={2} style={{ marginBottom:14 }}>
            <Card accent="#5dd4a6">
              <CardTitle>Workout consistency</CardTitle>
              <div style={{ display:'flex', gap:3, marginBottom:8, flexWrap:'wrap' }}>
                {(data.dailyWorkout || []).slice(-28).map((v, i) => (
                  <div key={i} style={{ width:'calc((100% - 81px) / 28)', minWidth:8, height:22, borderRadius:3, background:v ? '#3db88a' : 'rgba(255,255,255,0.06)', transition:'background 0.2s', flexShrink:0 }} title={v ? 'Workout' : 'Rest'} />
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)' }}>Last 28 days · green = workout day</div>
              <div style={{ marginTop:10, fontSize:14, fontWeight:600, color:'#5dd4a6' }}>
                {data.workoutCount} sessions · {Math.round(data.workoutCount / 30 * 7 * 10) / 10}/week avg
              </div>
            </Card>

            <Card accent="#6a96f0">
              <CardTitle>Wellness consistency</CardTitle>
              <div style={{ display:'flex', gap:3, marginBottom:8, flexWrap:'wrap' }}>
                {(data.dailyWellness || []).slice(-28).map((v, i) => (
                  <div key={i} style={{ width:'calc((100% - 81px) / 28)', minWidth:8, height:22, borderRadius:3, background:v > 0 ? `rgba(74,123,224,${Math.min(0.20 + v * 0.15, 0.85)})` : 'rgba(255,255,255,0.06)', flexShrink:0 }} title={v + ' goals'} />
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)' }}>Last 28 days · darker = more goals hit</div>
              <div style={{ marginTop:10, fontSize:14, fontWeight:600, color:'#6a96f0' }}>
                {data.goalsHit} goal completions this month
              </div>
            </Card>
          </Grid>

          {/* Habit + Daily Log summary */}
          <Grid cols={2} style={{ marginBottom:14 }}>
            <Card accent="#f5c842">
              <CardTitle>Habit tracker</CardTitle>
              <div style={{ fontFamily:FM, fontSize:32, color:'#f5c842', marginBottom:6 }}>{data.habitDays}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.50)' }}>habit completions in the last 30 days</div>
              <div style={{ marginTop:10, fontSize:12, color:'rgba(255,255,255,0.35)' }}>
                {data.habitDays > 0 ? `${Math.round(data.habitDays / 30 * 10) / 10} avg completions/day` : 'Start building habits in the Habits tab'}
              </div>
            </Card>

            <Card accent="#f07a62">
              <CardTitle>Daily log</CardTitle>
              <div style={{ fontFamily:FM, fontSize:32, color:'#f07a62', marginBottom:6 }}>{data.dlRate}%</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.50)' }}>task completion rate this month</div>
              <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:5, overflow:'hidden', marginTop:10 }}>
                <div style={{ width:data.dlRate+'%', height:'100%', background:'#f07a62', borderRadius:99, transition:'width 1s ease', boxShadow:'0 0 6px rgba(240,122,98,0.5)' }} />
              </div>
            </Card>
          </Grid>
        </>
      )}
    </div>
  )
}
