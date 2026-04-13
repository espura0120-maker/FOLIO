import { useState } from 'react'
import { format, subDays, startOfWeek, addDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTransactions, useFoodLogs, useWellness, useWorkouts, useJournal, useProfile } from '@/hooks/useData'
import { StatCard, Card, CardTitle, Grid, Button, EmptyState } from '@/components/shared/UI'
import { useToast } from '@/components/shared/Toast'

const SYMBOLS = { EUR:'€', USD:'$', JPY:'¥' }

function QuickLogModal({ onClose }) {
  const { add: addTx }   = useTransactions()
  const { add: addFood } = useFoodLogs()
  const [tab, setTab] = useState('transaction')
  const [txForm, setTxForm] = useState({ description:'', amount:'', type:'expense', category:'Food' })
  const [foodForm, setFoodForm] = useState({ name:'', calories:'', meal:'lunch' })
  const toast = useToast()

  function logTx(e) {
    e.preventDefault()
    if (!txForm.description || !txForm.amount) return
    addTx({ ...txForm, amount: +txForm.amount })
    toast.add({ message: 'Transaction logged!', type: 'success' })
    onClose()
  }

  function logFood(e) {
    e.preventDefault()
    if (!foodForm.name || !foodForm.calories) return
    addFood({ ...foodForm, calories: +foodForm.calories, protein_g:0, carbs_g:0, fat_g:0 })
    toast.add({ message: 'Food logged!', type: 'success' })
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div style={{ background:'rgba(28,30,43,0.97)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:22, padding:24, width:'100%', maxWidth:380, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>Quick Log</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.40)', fontSize:22, cursor:'pointer' }}>x</button>
        </div>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.06)', borderRadius:10, padding:3, gap:2, marginBottom:18 }}>
          {[['transaction','💰 Finance'],['food','🍽 Food']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'7px 8px', borderRadius:8, border:'none', background:tab===t?'#f5c842':'transparent', color:tab===t?'#1a1400':'rgba(255,255,255,0.45)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>{l}</button>
          ))}
        </div>

        {tab === 'transaction' && (
          <form onSubmit={logTx} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input value={txForm.description} onChange={e=>setTxForm(f=>({...f,description:e.target.value}))} placeholder="Description" required />
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={txForm.amount} onChange={e=>setTxForm(f=>({...f,amount:e.target.value}))} placeholder="Amount" min={0} step="0.01" required />
              <select value={txForm.type} onChange={e=>setTxForm(f=>({...f,type:e.target.value}))}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <Button type="submit" variant="gold" fullWidth>Log Transaction</Button>
          </form>
        )}

        {tab === 'food' && (
          <form onSubmit={logFood} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input value={foodForm.name} onChange={e=>setFoodForm(f=>({...f,name:e.target.value}))} placeholder="Food name" required />
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={foodForm.calories} onChange={e=>setFoodForm(f=>({...f,calories:e.target.value}))} placeholder="Calories" min={0} required />
              <select value={foodForm.meal} onChange={e=>setFoodForm(f=>({...f,meal:e.target.value}))}>
                {['breakfast','lunch','dinner','snack'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <Button type="submit" variant="gold" fullWidth>Log Food</Button>
          </form>
        )}
      </div>
    </div>
  )
}

function TrendChart({ data, color = '#f5c842', height = 48 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 200, h = height
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 8) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow:'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.08" stroke="none" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate    = useNavigate()
  const { profile } = useProfile()
  const { transactions, balance, income, expenses } = useTransactions()
  const { totalCalories, calGoal, todayLogs }        = useFoodLogs()
  const { goals, isCompleted, completedToday, toggle } = useWellness()
  const { sessions, sessionsThisWeek }               = useWorkouts()
  const { entries, streak }                          = useJournal()
  const [showQuick, setShowQuick]                    = useState(false)
  const toast = useToast()

  const fmt = n => (SYMBOLS[profile?.currency] || '€') + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
  const name = profile?.full_name?.split(' ')[0] || ''

  // Weekly spending data for sparkline
  const weeklySpend = Array.from({ length: 7 }, (_, i) => {
    const day = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return transactions.filter(t => t.date === day && t.type === 'expense').reduce((s, t) => s + +t.amount, 0)
  })

  // Calorie data for sparkline
  const weeklyCalories = Array.from({ length: 7 }, (_, i) => {
    const day = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    return 0 // placeholder — food_logs hook would need to return all logs
  })

  // Workout streak
  const workoutStreak = (() => {
    if (!sessions.length) return 0
    const dates = new Set(sessions.map(s => s.date))
    let count = 0, check = new Date()
    for (let i = 0; i < 365; i++) {
      const key = format(check, 'yyyy-MM-dd')
      if (dates.has(key)) { count++; check = subDays(check, 1) }
      else if (count > 0) break
      else check = subDays(check, 1)
    }
    return count
  })()

  const calPct = Math.min((totalCalories / calGoal) * 100, 100)

  return (
    <div className="fade-up">
      {showQuick && <QuickLogModal onClose={() => setShowQuick(false)} />}

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:22 }}>
        <div>
          <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:800, marginBottom:3 }}>
            {greeting()}{name ? `, ${name}` : ''} ✦
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        {/* Quick log FAB */}
        <button onClick={() => setShowQuick(true)} style={{
          width:42, height:42, borderRadius:'50%', background:'#f5c842', border:'none',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          boxShadow:'0 0 20px rgba(245,200,66,0.35)', flexShrink:0, fontSize:22, fontWeight:700, color:'#1a1400',
        }} title="Quick log">+</button>
      </div>

      {/* Stats row */}
      <Grid cols={4} style={{ marginBottom:14 }}>
        <StatCard label="Net Balance"    value={fmt(balance)}                         color="#f5c842" />
        <StatCard label="Calories"       value={totalCalories}                        color="#f07a62" sub={'of ' + calGoal + ' kcal'} accent={calPct} />
        <StatCard label="Goals Today"    value={completedToday + '/' + goals.length}  color="#5dd4a6" />
        <StatCard label="Journal Streak" value={streak + ' 🔥'}                       color="#6a96f0" sub="days" />
      </Grid>

      <Grid cols={2} style={{ marginBottom:14 }}>
        {/* Spending card with sparkline */}
        <Card>
          <CardTitle>Weekly Spending</CardTitle>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:24, fontWeight:500, color:'#f5c842', marginBottom:8 }}>{fmt(expenses)}</div>
          <TrendChart data={weeklySpend} color="#f5c842" />
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <span key={i} style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{d}</span>
            ))}
          </div>
        </Card>

        {/* Streaks card */}
        <Card>
          <CardTitle>Streaks</CardTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Journal',  value: streak,         color:'#6a96f0', icon:'✍️' },
              { label:'Workout',  value: workoutStreak,  color:'#a88ef0', icon:'🏋️' },
              { label:'Wellness', value: completedToday, color:'#5dd4a6', icon:'🎯', max: goals.length },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:18, width:26 }}>{s.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{s.label}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{s.value}{s.max ? '/' + s.max : ' days'}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:4, overflow:'hidden' }}>
                    <div style={{ width:Math.min((s.value / (s.max || 30)) * 100, 100) + '%', height:'100%', background:s.color, borderRadius:99, transition:'width 0.5s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Grid>

      <Grid cols={2} style={{ marginBottom:14 }}>
        {/* Wellness goals */}
        <Card>
          <CardTitle>Today's Goals</CardTitle>
          {goals.length === 0
            ? <EmptyState icon="🎯" message="Add wellness goals to track them here" />
            : goals.slice(0,5).map(g => (
              <div key={g.id} onClick={() => toggle(g.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', cursor:'pointer' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, border:'1.5px solid ' + (isCompleted(g.id)?'#3db88a':'rgba(255,255,255,0.20)'), background:isCompleted(g.id)?'rgba(61,184,138,0.18)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#5dd4a6', transition:'all 0.2s' }}>
                  {isCompleted(g.id) ? '✓' : ''}
                </div>
                <span style={{ fontSize:14, flex:1, color:isCompleted(g.id)?'rgba(255,255,255,0.40)':'rgba(255,255,255,0.85)', textDecoration:isCompleted(g.id)?'line-through':'none', transition:'all 0.2s' }}>{g.name}</span>
                <span style={{ fontSize:18 }}>{g.icon}</span>
              </div>
            ))
          }
          <Button size="sm" style={{ marginTop:10, width:'100%' }} onClick={() => navigate('/wellness')}>Manage Goals →</Button>
        </Card>

        {/* Today food */}
        <Card>
          <CardTitle>Today's Food Log</CardTitle>
          {/* Mini calorie ring */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:12 }}>
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke="#f07a62" strokeWidth="5"
                strokeDasharray={2*Math.PI*22} strokeDashoffset={2*Math.PI*22*(1-calPct/100)}
                strokeLinecap="round" transform="rotate(-90 26 26)" style={{ transition:'stroke-dashoffset 0.5s' }}/>
              <text x="26" y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="'Plus Jakarta Sans',sans-serif">
                {Math.round(calPct)}%
              </text>
            </svg>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#f07a62' }}>{totalCalories}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)' }}>of {calGoal} kcal</div>
            </div>
          </div>
          {todayLogs.length === 0
            ? <EmptyState icon="🍽" message="Nothing logged yet today" />
            : todayLogs.slice(0,4).map(f => (
              <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>{f.name}</span>
                <span style={{ fontSize:12, color:'#f07a62', fontFamily:"'JetBrains Mono',monospace" }}>{f.calories} kcal</span>
              </div>
            ))
          }
          <Button size="sm" style={{ marginTop:10, width:'100%' }} onClick={() => navigate('/nutrition')}>Log Food →</Button>
        </Card>
      </Grid>

      {/* Quick actions */}
      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['+ Transaction', '/finance'],
            ['+ Food Entry',  '/nutrition'],
            ['✓ Goals',       '/wellness'],
            ['+ Workout',     '/workout'],
            ['✍ Journal',    '/journal'],
            ['📅 Schedule',   '/schedule'],
          ].map(([label, path]) => (
            <Button key={path} size="sm" onClick={() => navigate(path)}>{label}</Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
