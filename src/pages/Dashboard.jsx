import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTransactions, useFoodLogs, useWellness, useWorkouts, useJournal, useProfile } from '@/hooks/useData'
import { StatCard, Card, CardTitle, Grid, Button, EmptyState, SkeletonCard } from '@/components/shared/UI'

const F  = "'Plus Jakarta Sans',system-ui,sans-serif"
const FS = "'DM Serif Display',Georgia,serif"
const FM = "'JetBrains Mono',monospace"
const SYMBOLS = { EUR:'€', USD:'$', JPY:'¥', GBP:'£' }

function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function greeting(name) {
  const h = new Date().getHours()
  const g = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night'
  return name ? `${g}, ${name}` : g
}

// Per-page gradient background
function PageGlow({ color }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: `radial-gradient(ellipse 80% 50% at 50% -10%, ${color}0d 0%, transparent 70%)`,
      transition: 'background 0.8s ease',
    }} />
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { balance, transactions } = useTransactions()
  const { totalCalories, calGoal, todayLogs } = useFoodLogs()
  const { goals, isCompleted, completedToday } = useWellness()
  const { sessions } = useWorkouts()
  const { entries, streak } = useJournal()
  const time = useClock()

  const fmt = n => (SYMBOLS[profile?.currency] || '€') + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const name = profile?.full_name?.split(' ')[0] || ''

  const workoutsThisWeek = sessions?.filter(s => {
    const d = new Date(s.date), now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek)
    return d >= weekStart
  }).length || 0

  const todaySpend = transactions?.filter(t => t.date === format(new Date(),'yyyy-MM-dd') && t.type==='expense')
    .reduce((s,t) => s+(+t.amount),0) || 0

  // Stagger animation for stat cards
  const statCards = [
    { label:'Balance',        value: fmt(balance),                              color:'#f5c842' },
    { label:'Calories Today', value: totalCalories,                             color:'#f07a62', sub:`of ${calGoal} kcal`, accent:(totalCalories/calGoal)*100 },
    { label:'Goals Today',    value: `${completedToday}/${goals.length}`,       color:'#5dd4a6' },
    { label:'Journal Streak', value: `${streak}🔥`,                             color:'#6a96f0', sub:'days in a row' },
    { label:"Today's Spend",  value: fmt(todaySpend),                           color:'#f07a62' },
    { label:'Workouts',       value: workoutsThisWeek,                          color:'#a88ef0', sub:'this week' },
  ]

  return (
    <div className="fade-up" style={{ position:'relative' }}>
      <PageGlow color="#f5c842" />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Hero section */}
        <div style={{ marginBottom:28, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <h1 style={{ fontFamily:FS, fontSize:32, fontWeight:400, lineHeight:1.1, marginBottom:6,
              background:'linear-gradient(135deg, #fff 0%, #f5c842 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
              letterSpacing:'-0.02em',
            }}>
              {greeting(name)} ✦
            </h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.40)', letterSpacing:'0.01em' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Live clock */}
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:FM, fontSize:36, fontWeight:300, color:'rgba(255,255,255,0.90)', lineHeight:1, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums' }}>
              {format(time, 'HH:mm')}
              <span style={{ fontSize:20, color:'rgba(255,255,255,0.35)', marginLeft:2 }}>
                :{format(time,'ss')}
              </span>
            </div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:4, letterSpacing:'0.05em', textTransform:'uppercase' }}>
              {format(time,'EEEE')}
            </div>
          </div>
        </div>

        {/* Today snapshot strip — 6 stats staggered in */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,minmax(0,1fr))', gap:10, marginBottom:18 }}>
          {statCards.map((s, i) => (
            <div key={s.label} style={{ animation:'fadeUp 0.35s ease both', animationDelay:`${i*60}ms` }}>
              <StatCard {...s} />
            </div>
          ))}
        </div>

        {/* Summary sentence */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'10px 16px', marginBottom:18, fontSize:13, color:'rgba(255,255,255,0.50)', lineHeight:1.6, backdropFilter:'blur(14px)' }}>
          {completedToday === goals.length && goals.length > 0
            ? <span>🎉 All <strong style={{ color:'#5dd4a6' }}>{goals.length}</strong> wellness goals done today!</span>
            : <span>You've completed <strong style={{ color:'#5dd4a6' }}>{completedToday}</strong> of <strong style={{ color:'rgba(255,255,255,0.70)' }}>{goals.length}</strong> goals</span>
          }
          {streak > 0 && <span> · <strong style={{ color:'#f5c842' }}>{streak} day</strong> journal streak 🔥</span>}
          {workoutsThisWeek > 0 && <span> · <strong style={{ color:'#a88ef0' }}>{workoutsThisWeek} workout{workoutsThisWeek>1?'s':''}</strong> this week</span>}
        </div>

        <Grid cols={2} style={{ marginBottom:16 }}>
          {/* Wellness goals */}
          <Card accent="#5dd4a6">
            <CardTitle>Today's Wellness Goals</CardTitle>
            {goals.length === 0
              ? <EmptyState icon="🎯" message="Add wellness goals to track them here" action="Add Goal" onAction={() => navigate('/wellness')} />
              : <>
                  {goals.slice(0,5).map((g,i) => {
                    const done = isCompleted(g.id)
                    return (
                      <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)', animation:'fadeUp 0.3s ease both', animationDelay:`${i*50}ms` }}>
                        <span style={{ fontSize:18 }}>{g.icon}</span>
                        <span style={{ fontSize:13, flex:1, color:done?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.80)', textDecoration:done?'line-through':'none', transition:'all 0.3s' }}>{g.name}</span>
                        <div style={{ width:18, height:18, borderRadius:'50%', border:`1.5px solid ${done?'#5dd4a6':'rgba(255,255,255,0.22)'}`, background:done?'rgba(93,212,166,0.18)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'#5dd4a6', transition:'all 0.3s', boxShadow:done?'0 0 8px rgba(93,212,166,0.4)':'none' }}>
                          {done?'✓':''}
                        </div>
                      </div>
                    )
                  })}
                  <Button size="sm" style={{ marginTop:12, width:'100%' }} onClick={() => navigate('/wellness')}>
                    Manage Goals →
                  </Button>
                </>
            }
          </Card>

          {/* Food log */}
          <Card accent="#f07a62">
            <CardTitle>Today's Food</CardTitle>
            {todayLogs.length === 0
              ? <EmptyState icon="🍽️" message="Nothing logged yet today" action="Log Food" onAction={() => navigate('/nutrition')} />
              : <>
                  {/* Calorie progress bar */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11, color:'rgba(255,255,255,0.40)' }}>Calories</span>
                      <span style={{ fontFamily:FM, fontSize:12, color:'#f07a62' }}>{totalCalories} / {calGoal}</span>
                    </div>
                    <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:4 }}>
                      <div style={{ width:Math.min(totalCalories/calGoal*100,100)+'%', height:'100%', background:'linear-gradient(90deg,#f0a262,#f07a62)', borderRadius:99, transition:'width 1s ease', boxShadow:'0 0 8px rgba(240,122,98,0.5)' }} />
                    </div>
                  </div>
                  {todayLogs.slice(0,4).map((f,i) => (
                    <div key={f.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', animation:'fadeUp 0.3s ease both', animationDelay:`${i*50}ms` }}>
                      <span style={{ fontSize:13, color:'rgba(255,255,255,0.75)' }}>{f.name}</span>
                      <span style={{ fontFamily:FM, fontSize:12, color:'#f07a62' }}>{f.calories} kcal</span>
                    </div>
                  ))}
                  <Button size="sm" style={{ marginTop:12, width:'100%' }} onClick={() => navigate('/nutrition')}>
                    Log Food →
                  </Button>
                </>
            }
          </Card>
        </Grid>

        {/* Quick actions */}
        <Card accent="#f5c842">
          <CardTitle>Quick Actions</CardTitle>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[
              { label:'✦ Daily Log',     path:'/daily-log',   color:'#f5c842' },
              { label:'+ Transaction',   path:'/finance',     color:'#f5c842' },
              { label:'+ Food',          path:'/nutrition',   color:'#f07a62' },
              { label:'✓ Goals',         path:'/wellness',    color:'#5dd4a6' },
              { label:'+ Workout',       path:'/workout',     color:'#a88ef0' },
              { label:'✍ Journal',       path:'/journal',     color:'#6a96f0' },
              { label:'📋 Week Review',  path:'/weekly-review',color:'#a88ef0' },
            ].map((a,i) => (
              <button key={a.path} onClick={() => navigate(a.path)}
                style={{ padding:'7px 14px', borderRadius:9, fontFamily:F, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.18s', border:`1px solid ${a.color}30`, background:`${a.color}10`, color:a.color, animation:'fadeUp 0.3s ease both', animationDelay:`${i*40}ms` }}
                onMouseEnter={e => { e.currentTarget.style.background=`${a.color}22`; e.currentTarget.style.borderColor=`${a.color}55` }}
                onMouseLeave={e => { e.currentTarget.style.background=`${a.color}10`; e.currentTarget.style.borderColor=`${a.color}30` }}>
                {a.label}
              </button>
            ))}
          </div>
        </Card>

      </div>
    </div>
  )
}
