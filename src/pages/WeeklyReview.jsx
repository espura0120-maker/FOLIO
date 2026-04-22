import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, eachDayOfInterval } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { useTransactions, useWorkouts, useJournal, useWellness, useProfile } from '@/hooks/useData'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const FM = "'JetBrains Mono',monospace"
const F  = "'Plus Jakarta Sans',sans-serif"
const SYMBOLS = { EUR:'€', USD:'$', JPY:'¥' }

function ScoreRing({ value, max, color, size = 56, label }) {
  const pct = Math.min(value / max, 1)
  const r   = (size - 8) / 2
  const circ = 2 * Math.PI * r
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:'stroke-dashoffset 1s ease', filter:`drop-shadow(0 0 4px ${color}80)` }} />
        <text x={size/2} y={size/2+4} textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily={FM}>
          {value}
        </text>
      </svg>
      <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</span>
    </div>
  )
}

export default function WeeklyReview() {
  const { user }    = useAuth()
  const { profile } = useProfile()
  const { transactions } = useTransactions()
  const { sessions }     = useWorkouts()
  const { entries }      = useJournal()
  const { goals, isCompleted } = useWellness()

  const [weekOffset, setWeekOffset] = useState(0)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [reflection, setReflection] = useState({ wins:'', challenges:'', focus:'' })
  const [savingReflection, setSavingReflection] = useState(false)

  const sym = SYMBOLS[profile?.currency] || '€'

  const refDate   = weekOffset === 0 ? new Date() : subWeeks(new Date(), -weekOffset)
  const weekStart = startOfWeek(refDate, { weekStartsOn: 1 })
  const weekEnd   = endOfWeek(refDate,   { weekStartsOn: 1 })
  const weekDays  = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekLabel = format(weekStart, 'MMM d') + ' – ' + format(weekEnd, 'MMM d, yyyy')
  const isCurrentWeek = weekOffset === 0

  // Filter data for this week
  const inWeek = (dateStr) => dateStr >= format(weekStart,'yyyy-MM-dd') && dateStr <= format(weekEnd,'yyyy-MM-dd')

  const weekTxs        = transactions.filter(t => inWeek(t.date))
  const weekExpenses   = weekTxs.filter(t => t.type === 'expense').reduce((s,t) => s + +t.amount, 0)
  const weekIncome     = weekTxs.filter(t => t.type === 'income').reduce((s,t) => s + +t.amount, 0)
  const weekWorkouts   = sessions.filter(s => inWeek(s.date))
  const weekJournals   = entries.filter(e => {
    const d = e.date || (e.created_at && e.created_at.slice(0,10))
    return d && inWeek(d)
  })
  const avgMood        = weekJournals.filter(e => e.mood).length > 0
    ? (weekJournals.filter(e => e.mood).reduce((s,e) => s + e.mood, 0) / weekJournals.filter(e => e.mood).length).toFixed(1)
    : null

  const fmt = n => sym + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })

  // Load saved reflection for this week
  useEffect(() => {
    if (!user) return
    const key = format(weekStart, 'yyyy-MM-dd')
    supabase.from('weekly_reviews').select('*').eq('user_id', user.id).eq('week_start', key).single()
      .then(({ data }) => {
        if (data) setReflection({ wins: data.wins || '', challenges: data.challenges || '', focus: data.focus || '' })
        else setReflection({ wins:'', challenges:'', focus:'' })
      })
  }, [weekStart.toISOString(), user])

  async function saveReflection() {
    if (!user) return
    setSavingReflection(true)
    const key = format(weekStart, 'yyyy-MM-dd')
    await supabase.from('weekly_reviews').upsert({
      user_id:    user.id,
      week_start: key,
      wins:       reflection.wins,
      challenges: reflection.challenges,
      focus:      reflection.focus,
    }, { onConflict: 'user_id,week_start' })
    setSavingReflection(false)
  }

  async function generateInsight() {
    setAiLoading(true)
    const prompt = `You are a personal coach reviewing someone's week. Give a concise, warm 2-3 sentence insight and one actionable suggestion.

Week: ${weekLabel}
- Workouts: ${weekWorkouts.length} sessions
- Journal entries: ${weekJournals.length} (avg mood: ${avgMood || 'N/A'})
- Spending: ${fmt(weekExpenses)} on ${weekTxs.filter(t=>t.type==='expense').length} transactions
- Income: ${fmt(weekIncome)}
${reflection.wins ? '- Their wins: ' + reflection.wins : ''}
${reflection.challenges ? '- Their challenges: ' + reflection.challenges : ''}

Be specific, insightful, and encouraging. Reference actual numbers. 2-3 sentences + 1 suggestion.`

    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'anthropic-version':'2023-06-01' },
        body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:200, messages:[{role:'user',content:prompt}] })
      })
      const d = await r.json()
      setAiInsight(d.content?.[0]?.text || '')
    } catch {
      setAiInsight('Great job tracking your week! Keep building those habits.')
    }
    setAiLoading(false)
  }

  const inp = { background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#fff', fontSize:14, padding:'10px 13px', width:'100%', outline:'none', fontFamily:F, resize:'vertical', lineHeight:1.6, boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:6, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }

  return (
    <div className="fade-up">
      <SectionHeader title="Weekly Review" sub="Reflect · Review · Plan" accent="#a88ef0" />

      {/* Week navigation */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
        <button onClick={() => setWeekOffset(w => w - 1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 14px', cursor:'pointer', fontFamily:F }}>← Prev</button>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:15, fontWeight:700, color: isCurrentWeek ? '#a88ef0' : '#fff' }}>
            {isCurrentWeek ? 'This Week' : weekLabel}
          </div>
          {isCurrentWeek && <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:2 }}>{weekLabel}</div>}
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(w + 1, 0))} disabled={isCurrentWeek} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color: isCurrentWeek ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 14px', cursor: isCurrentWeek ? 'not-allowed' : 'pointer', fontFamily:F, opacity: isCurrentWeek ? 0.4 : 1 }}>Next →</button>
      </div>

      {/* Stats rings */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:16 }}>Week at a Glance</div>
        <div style={{ display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:16 }}>
          <ScoreRing value={weekWorkouts.length} max={7} color="#a88ef0" label="Workouts" />
          <ScoreRing value={weekJournals.length} max={7} color="#6a96f0" label="Journals" />
          <ScoreRing value={weekTxs.filter(t=>t.type==='expense').length} max={20} color="#f5c842" label="Purchases" />
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(93,212,166,0.12)', border:'2px solid rgba(93,212,166,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:FM, fontSize:14, fontWeight:700, color:'#5dd4a6' }}>
              {avgMood ? '★'+avgMood : '—'}
            </div>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.38)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Avg Mood</span>
          </div>
        </div>

        {/* Spending summary */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Spent</div>
            <div style={{ fontFamily:FM, fontSize:20, color:'#f07a62' }}>{fmt(weekExpenses)}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Earned</div>
            <div style={{ fontFamily:FM, fontSize:20, color:'#5dd4a6' }}>{fmt(weekIncome)}</div>
          </div>
        </div>
      </div>

      {/* Workout activity grid */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Activity This Week</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
          {weekDays.map(day => {
            const dateKey  = format(day, 'yyyy-MM-dd')
            const workout  = sessions.find(s => s.date === dateKey)
            const journal  = entries.find(e => (e.date || e.created_at?.slice(0,10)) === dateKey)
            return (
              <div key={dateKey} style={{ textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:5 }}>{format(day,'EEE')}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginBottom:6 }}>{format(day,'d')}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:3, alignItems:'center' }}>
                  <div title="Workout" style={{ width:16, height:16, borderRadius:4, background: workout ? '#a88ef0' : 'rgba(255,255,255,0.06)', boxShadow: workout ? '0 0 6px #a88ef090' : 'none' }} />
                  <div title="Journal" style={{ width:16, height:16, borderRadius:4, background: journal ? '#6a96f0' : 'rgba(255,255,255,0.06)', boxShadow: journal ? '0 0 6px #6a96f090' : 'none' }} />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:14, marginTop:12, fontSize:11, color:'rgba(255,255,255,0.30)' }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#a88ef0', display:'inline-block' }} />Workout</span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}><span style={{ width:10, height:10, borderRadius:2, background:'#6a96f0', display:'inline-block' }} />Journal</span>
        </div>
      </div>

      {/* Reflection inputs */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20, marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:16 }}>Weekly Reflection</div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>🏆 Wins this week</label>
            <textarea value={reflection.wins} onChange={e => setReflection(r => ({ ...r, wins: e.target.value }))} placeholder="What went well? Any accomplishments?" rows={2} style={inp} />
          </div>
          <div>
            <label style={lbl}>🚧 Challenges</label>
            <textarea value={reflection.challenges} onChange={e => setReflection(r => ({ ...r, challenges: e.target.value }))} placeholder="What was difficult? What held you back?" rows={2} style={inp} />
          </div>
          <div>
            <label style={lbl}>🎯 Focus for next week</label>
            <textarea value={reflection.focus} onChange={e => setReflection(r => ({ ...r, focus: e.target.value }))} placeholder="What's the #1 thing you want to prioritise?" rows={2} style={inp} />
          </div>
          <button onClick={saveReflection} disabled={savingReflection} style={{ background:'#f5c842', border:'none', borderRadius:11, color:'#1a1400', fontSize:13, fontWeight:800, padding:'12px', cursor:'pointer', fontFamily:F, width:'100%', opacity: savingReflection ? 0.6 : 1 }}>
            {savingReflection ? 'Saving...' : 'Save Reflection'}
          </button>
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ background:'rgba(168,142,240,0.08)', border:'1px solid rgba(168,142,240,0.20)', borderRadius:16, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: aiInsight ? 14 : 0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#a88ef0', boxShadow:'0 0 8px #a88ef0' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'#a88ef0', letterSpacing:'0.07em', textTransform:'uppercase' }}>AI Week Insight</span>
          </div>
          <button onClick={generateInsight} disabled={aiLoading} style={{ background:'rgba(168,142,240,0.16)', border:'1px solid rgba(168,142,240,0.30)', borderRadius:9, color:'#a88ef0', fontSize:12, fontWeight:700, padding:'6px 14px', cursor: aiLoading ? 'not-allowed' : 'pointer', fontFamily:F, display:'flex', alignItems:'center', gap:6 }}>
            {aiLoading ? <><div style={{ width:11, height:11, border:'2px solid rgba(168,142,240,0.3)', borderTopColor:'#a88ef0', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} /> Thinking...</> : '✦ Generate'}
          </button>
        </div>
        {aiInsight && (
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.80)', lineHeight:1.7, fontStyle:'italic' }}>"{aiInsight}"</div>
        )}
        {!aiInsight && !aiLoading && (
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.30)', marginTop:10 }}>Click Generate for a personalised AI analysis of your week</div>
        )}
      </div>
    </div>
  )
}
