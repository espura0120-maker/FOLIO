// Mood Graph component — add to Insights.jsx
// Shows journal mood over time with workout and spending overlays

import { useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'

const FM = "'JetBrains Mono',monospace"
const F  = "'Plus Jakarta Sans',sans-serif"

const MOOD_LABELS = { 1:'😔', 2:'😕', 3:'😐', 4:'🙂', 5:'😊', 6:'😄', 7:'🤩' }
const MOOD_COLORS = { 1:'#f07a62', 2:'#f0a262', 3:'#f5c842', 4:'#b8e86e', 5:'#5dd4a6', 6:'#6a96f0', 7:'#a88ef0' }

export function MoodGraph({ journalEntries = [], workoutSessions = [], transactions = [], days = 30 }) {
  const data = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const date    = subDays(new Date(), days - 1 - i)
      const dateKey = format(date, 'yyyy-MM-dd')
      const entry   = journalEntries.find(e => e.date === dateKey || (e.created_at && e.created_at.startsWith(dateKey)))
      const hasWorkout  = workoutSessions.some(s => s.date === dateKey)
      const daySpend    = transactions.filter(t => t.date === dateKey && t.type === 'expense').reduce((s,t) => s + +t.amount, 0)
      return {
        date: dateKey,
        label: format(date, 'MMM d'),
        mood: entry?.mood || null,
        hasWorkout,
        daySpend,
        shortLabel: format(date, 'd'),
      }
    })
  }, [journalEntries, workoutSessions, transactions, days])

  const moodData  = data.filter(d => d.mood !== null)
  const maxSpend  = Math.max(...data.map(d => d.daySpend), 1)
  const avgMood   = moodData.length > 0 ? (moodData.reduce((s,d) => s + d.mood, 0) / moodData.length).toFixed(1) : null

  // SVG dimensions
  const W = 600, H = 120, PAD = 20
  const innerW = W - PAD * 2
  const innerH = H - PAD * 2

  function xPos(i) { return PAD + (i / (data.length - 1)) * innerW }
  function yPos(mood) { return PAD + innerH - ((mood - 1) / 6) * innerH }

  // Build polyline path for mood
  const moodPoints = data
    .map((d, i) => d.mood ? `${xPos(i)},${yPos(d.mood)}` : null)
    .filter(Boolean)

  // Smooth path using only connected segments
  const segments = []
  let currentSeg = []
  data.forEach((d, i) => {
    if (d.mood) {
      currentSeg.push([xPos(i), yPos(d.mood), d])
    } else if (currentSeg.length > 0) {
      segments.push(currentSeg)
      currentSeg = []
    }
  })
  if (currentSeg.length > 0) segments.push(currentSeg)

  if (moodData.length === 0) {
    return (
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:24, textAlign:'center' }}>
        <div style={{ fontSize:32, marginBottom:8, opacity:0.35 }}>📈</div>
        <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.40)', marginBottom:6 }}>No mood data yet</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>Set your mood when writing journal entries to see it plotted here</div>
      </div>
    )
  }

  return (
    <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>Mood Over Time</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>Last {days} days · {moodData.length} entries</div>
        </div>
        <div style={{ display:'flex', gap:16 }}>
          {avgMood && (
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:FM, fontSize:20, color:'#a88ef0', lineHeight:1 }}>{avgMood}</div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>avg mood</div>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart */}
      <div style={{ overflowX:'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow:'visible', display:'block' }}>
          {/* Grid lines */}
          {[1,2,3,4,5,6,7].map(m => (
            <line key={m} x1={PAD} x2={W-PAD} y1={yPos(m)} y2={yPos(m)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}

          {/* Mood labels on Y axis */}
          {[1,3,5,7].map(m => (
            <text key={m} x={PAD-6} y={yPos(m)+4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.28)" fontFamily={FM}>{MOOD_LABELS[m]}</text>
          ))}

          {/* Spending overlay as bars */}
          {data.map((d, i) => {
            if (!d.daySpend) return null
            const barH = (d.daySpend / maxSpend) * (innerH * 0.4)
            return (
              <rect key={d.date+'spend'} x={xPos(i)-3} y={H-PAD-barH} width={6} height={barH}
                fill="rgba(245,200,66,0.20)" rx="2" />
            )
          })}

          {/* Workout dots on top */}
          {data.map((d, i) => {
            if (!d.hasWorkout) return null
            return (
              <circle key={d.date+'w'} cx={xPos(i)} cy={H-8} r={3} fill="#a88ef0" opacity={0.7} />
            )
          })}

          {/* Mood line segments */}
          {segments.map((seg, si) => {
            if (seg.length < 2) return null
            const pts = seg.map(([x,y]) => `${x},${y}`).join(' ')
            return (
              <polyline key={si} points={pts} fill="none" stroke="#5dd4a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )
          })}

          {/* Filled area under mood */}
          {segments.map((seg, si) => {
            if (seg.length < 2) return null
            const pts = seg.map(([x,y]) => `${x},${y}`).join(' ')
            const first = seg[0], last = seg[seg.length-1]
            return (
              <polygon key={si+'area'} points={`${first[0]},${H-PAD} ${pts} ${last[0]},${H-PAD}`}
                fill="rgba(93,212,166,0.08)" />
            )
          })}

          {/* Mood dots */}
          {data.map((d, i) => {
            if (!d.mood) return null
            const color = MOOD_COLORS[d.mood] || '#5dd4a6'
            return (
              <g key={d.date+'dot'}>
                <circle cx={xPos(i)} cy={yPos(d.mood)} r={5} fill={color} stroke="#0e0f16" strokeWidth={2} />
                <circle cx={xPos(i)} cy={yPos(d.mood)} r={9} fill="transparent" stroke={color} strokeWidth={1} opacity={0.3} />
              </g>
            )
          })}

          {/* X axis date labels — every 5 days */}
          {data.map((d, i) => {
            if (i % 5 !== 0 && i !== data.length - 1) return null
            return (
              <text key={d.date+'lbl'} x={xPos(i)} y={H+8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.25)" fontFamily={FM}>{d.shortLabel}</text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.40)' }}>
          <div style={{ width:16, height:3, borderRadius:2, background:'#5dd4a6' }} />
          Mood
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.40)' }}>
          <div style={{ width:8, height:8, borderRadius:2, background:'rgba(245,200,66,0.40)' }} />
          Spending
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.40)' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#a88ef0' }} />
          Workout day
        </div>
        <div style={{ marginLeft:'auto', fontSize:11, color:'rgba(255,255,255,0.28)' }}>
          Mood scale: 😔 1 — 7 🤩
        </div>
      </div>
    </div>
  )
}
