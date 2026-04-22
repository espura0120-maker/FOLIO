import { useState, useEffect } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, SectionHeader, Grid, Spinner, StatCard } from '@/components/shared/UI'
import { MoodGraph } from '@/components/shared/MoodGraph'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FM = "'JetBrains Mono',monospace"

function TrendLine({ data, color='#f5c842', height=48 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1), min = Math.min(...data, 0)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data.map((v,i) => {
    const x = (i/(data.length-1))*w
    const y = h - ((v-min)/range)*(h-8) - 4
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id={'tg'+color.replace('#','')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`url(#tg${color.replace('#','')})`} stroke="none"/>
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
      <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:trend?12:0 }}>{description}</div>
      {trend && <TrendLine data={trend} color={color} />}
    </Card>
  )
}

export default function Insights() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData]       = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { if (user) loadData() }, [user])

  async function loadData() {
    setLoading(true)
    const days30 = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const days7  = format(subDays(new Date(), 7),  'yyyy-MM-dd')

    const [tx, food, wellness, sessions, journal] = await Promise.all([
      supabase.from('transactions').select('*').gte('date', days30),
      supabase.from('food_logs').select('*').gte('date', days30),
      supabase.from('wellness_checkins').select('*').gte('date', days30),
      supabase.from('workout_sessions').select('*').gte('date', days30),
      supabase.from('journal_entries').select('id,mood,date').gte('date', days30),
      <MoodGraph journalEntries={entries} workoutSessions={sessions} transactions={transactions} />
    ])

    const txData      = tx.data || []
    const foodData    = food.data || []
    const wellData    = wellness.data || []
    const sessData    = sessions.data || []
    const journalData = journal.data || []

    // Build per-day stats for the last 30 days
    const days = Array.from({length:30}, (_,i) => format(subDays(new Date(), 29-i), 'yyyy-MM-dd'))

    const dailySpend    = days.map(d => txData.filter(t=>t.date===d&&t.type==='expense').reduce((s,t)=>s+(+t.amount||0),0))
    const dailyCalories = days.map(d => foodData.filter(f=>f.date===d).reduce((s,f)=>s+(+f.calories||0),0))
    const dailyWorkout  = days.map(d => sessData.some(s=>s.date===d) ? 1 : 0)
    const dailyWellness = days.map(d => wellData.filter(w=>w.date===d).length)

    // Correlation: workout days vs avg mood (mock mood from journal length as proxy)
    const workoutDays   = days.filter((_,i) => dailyWorkout[i] === 1)
    const noWorkoutDays = days.filter((_,i) => dailyWorkout[i] === 0)
    const avgCalWorkout   = workoutDays.map(d => foodData.filter(f=>f.date===d).reduce((s,f)=>s+(+f.calories||0),0))
    const avgCalNoWorkout = noWorkoutDays.map(d => foodData.filter(f=>f.date===d).reduce((s,f)=>s+(+f.calories||0),0))
    const calOnWorkout    = avgCalWorkout.length   ? Math.round(avgCalWorkout.reduce((a,b)=>a+b,0)/avgCalWorkout.length)   : 0
    const calOnRest       = avgCalNoWorkout.length ? Math.round(avgCalNoWorkout.reduce((a,b)=>a+b,0)/avgCalNoWorkout.length): 0

    // Total stats
    const totalSpend   = txData.filter(t=>t.type==='expense').reduce((s,t)=>s+(+t.amount||0),0)
    const avgDailySpend= days.length ? totalSpend/days.length : 0
    const workoutCount = sessData.length
    const journalCount = journalData.length
    const goalsHit     = wellData.length

    // Best spending day
    const spendByDay   = [0,1,2,3,4,5,6].map(dow => {
      const dowTx = txData.filter(t => t.type==='expense' && new Date(t.date).getDay()===dow)
      return dowTx.reduce((s,t)=>s+(+t.amount||0),0)
    })
    const DAYS_LABEL = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const maxDow = spendByDay.indexOf(Math.max(...spendByDay))

    setData({
      dailySpend, dailyCalories, dailyWorkout, dailyWellness,
      totalSpend, avgDailySpend, workoutCount, journalCount, goalsHit,
      calOnWorkout, calOnRest, maxSpendDay: DAYS_LABEL[maxDow],
      days30Count: days.length,
    })
    setLoading(false)
  }

  async function generateAiInsight() {
    if (!data) return
    setAiLoading(true)
    try {
      const prompt = `You are a personal wellness and finance coach. Based on this 30-day summary, write a warm, encouraging 3-sentence insight for the user. Be specific with numbers. End with one actionable tip.

Data:
- Total spending: €${Math.round(data.totalSpend)}
- Avg daily spend: €${Math.round(data.avgDailySpend)}
- Highest spend day: ${data.maxSpendDay}
- Workout sessions: ${data.workoutCount}
- Journal entries: ${data.journalCount}
- Wellness goals completed: ${data.goalsHit}
- Avg calories on workout days: ${data.calOnWorkout} kcal
- Avg calories on rest days: ${data.calOnRest} kcal

Write 3 sentences max. Be direct and personal, not generic.`

      const resp = await supabase.functions.invoke('analyze-food', {
        body: { text: prompt, type: 'insight' }
      })

      if (resp.data?.insight) {
        setAiInsight(resp.data.insight)
      } else {
        // Fallback to direct API if edge function not set up for insights
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' },
          body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:300, messages:[{role:'user',content:prompt}] })
        })
        const d = await r.json()
        setAiInsight(d.content?.[0]?.text || 'Unable to generate insight right now.')
      }
    } catch {
      setAiInsight('Keep going — every log, workout, and journal entry is building a clearer picture of your habits. You\'re doing great.')
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
          {/* AI summary card */}
          <Card style={{ marginBottom:16 }} accent="#a88ef0">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <CardTitle>AI Summary</CardTitle>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.32)' }}>Powered by Claude</div>
              </div>
              <button onClick={generateAiInsight} disabled={aiLoading} style={{
                background:'rgba(138,110,216,0.16)', border:'1px solid rgba(138,110,216,0.30)',
                borderRadius:10, color:'#a88ef0', fontSize:12, fontWeight:700, padding:'7px 14px',
                cursor:aiLoading?'not-allowed':'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:6,
                transition:'all 0.18s',
              }}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(138,110,216,0.26)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(138,110,216,0.16)'}>
                {aiLoading ? <Spinner size={13} color="#a88ef0" /> : '✦'}
                {aiLoading ? 'Analysing...' : 'Generate Insight'}
              </button>
            </div>
            {aiInsight ? (
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.82)', lineHeight:1.75, padding:'12px 14px', background:'rgba(138,110,216,0.08)', borderRadius:12, border:'1px solid rgba(138,110,216,0.15)', animation:'fadeIn 0.4s ease', fontStyle:'italic' }}>
                "{aiInsight}"
              </div>
            ) : (
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.32)', textAlign:'center', padding:'16px 0' }}>
                Tap Generate Insight for a personalised 30-day analysis ✦
              </div>
            )}
          </Card>

          <Grid cols={4} style={{ marginBottom:14 }}>
            <StatCard label="Workouts"     value={data.workoutCount}                        color="#a88ef0" />
            <StatCard label="Journal Days" value={data.journalCount}                        color="#f5c842" />
            <StatCard label="Goals Hit"    value={data.goalsHit}                            color="#5dd4a6" />
            <StatCard label="Avg Daily €"  value={'€'+Math.round(data.avgDailySpend)}       color="#f07a62" />
          </Grid>

          <Grid cols={2} style={{ marginBottom:14 }}>
            <CorrelationCard
              title="Spending this week"
              value={'€'+Math.round(weekSpend.reduce((a,b)=>a+b,0))}
              description={`Your highest spending day is ${data.maxSpendDay}. ${data.avgDailySpend > 30 ? 'Consider setting stricter daily limits.' : 'Your daily spending looks healthy.'}`}
              color="#f5c842"
              trend={weekSpend}
            />
            <CorrelationCard
              title="Calories this week"
              value={Math.round(weekCal.reduce((a,b)=>a+b,0)/7||0)+' avg'}
              description={data.calOnWorkout && data.calOnRest ? `You eat ${Math.abs(data.calOnWorkout - data.calOnRest)} kcal ${data.calOnWorkout > data.calOnRest ? 'more' : 'less'} on workout days. ${data.calOnWorkout > data.calOnRest ? 'Good — fuelling your sessions.' : 'Consider eating more on active days.'}` : 'Log more food to see patterns here.'}
              color="#f07a62"
              trend={weekCal}
            />
          </Grid>

          <Grid cols={2} style={{ marginBottom:14 }}>
            <Card accent="#5dd4a6">
              <CardTitle>Workout consistency</CardTitle>
              <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                {(data.dailyWorkout||[]).slice(-28).map((v,i) => (
                  <div key={i} style={{ flex:1, height:24, borderRadius:4, background:v?'#3db88a':'rgba(255,255,255,0.06)', transition:'background 0.2s' }} title={v?'Workout':'Rest'} />
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)' }}>Last 28 days · green = workout day</div>
              <div style={{ marginTop:10, fontSize:14, fontWeight:600, color:'#5dd4a6' }}>
                {data.workoutCount} sessions in 30 days ({Math.round(data.workoutCount/30*7*10)/10}/week avg)
              </div>
            </Card>

            <Card accent="#6a96f0">
              <CardTitle>Wellness consistency</CardTitle>
              <div style={{ display:'flex', gap:4, marginBottom:8 }}>
                {(data.dailyWellness||[]).slice(-28).map((v,i) => (
                  <div key={i} style={{ flex:1, height:24, borderRadius:4, background:v>0?`rgba(74,123,224,${Math.min(0.20+v*0.15,0.85)})`:'rgba(255,255,255,0.06)' }} title={v+' goals'} />
                ))}
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)' }}>Last 28 days · darker = more goals hit</div>
              <div style={{ marginTop:10, fontSize:14, fontWeight:600, color:'#6a96f0' }}>
                {data.goalsHit} goal completions this month
              </div>
            </Card>
          </Grid>
        </>
      )}
    </div>
  )
}
