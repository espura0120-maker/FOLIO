import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useTransactions, useFoodLogs, useWellness, useWorkouts, useJournal, useProfile } from '@/hooks/useData'
import { useProfile } from '@/hooks/useData'
import { StatCard, Card, CardTitle, Grid, Button, EmptyState } from '@/components/shared/UI'

const SYMBOLS = { EUR: '€', USD: '$', JPY: '¥' }

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const { balance } = useTransactions()
  const { profile } = useProfile()
const fmt = n => (SYMBOLS[profile?.currency] || '€') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const { totalCalories, calGoal, todayLogs } = useFoodLogs()
  const { goals, isCompleted, completedToday } = useWellness()
  const { sessions } = useWorkouts()
  const { entries, streak } = useJournal()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }
  const name = profile?.full_name?.split(' ')[0] || ''

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, fontWeight: 400 }}>
          {greeting()}{name ? `, ${name}` : ''} ✦
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 3 }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <Grid cols={4} style={{ marginBottom: 16 }}>
        <StatCard label="Net Balance"    value={fmt(balance)}                               color="var(--gold2)" />
        <StatCard label="Calories Today" value={totalCalories}                              color="var(--coral2)" sub={`of ${calGoal} kcal`} accent={(totalCalories / calGoal) * 100} />
        <StatCard label="Goals Today"    value={`${completedToday}/${goals.length}`}        color="var(--teal2)" />
        <StatCard label="Journal Streak" value={`${streak} 🔥`}                             color="var(--blue2)" sub="days in a row" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Today's Wellness Goals</CardTitle>
          {goals.length === 0
            ? <EmptyState icon="🎯" message="Add wellness goals to track them here" />
            : goals.slice(0, 5).map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{g.icon}</span>
                <span style={{ fontSize: 14, flex: 1, color: isCompleted(g.id) ? 'var(--text3)' : 'var(--text)', textDecoration: isCompleted(g.id) ? 'line-through' : 'none' }}>{g.name}</span>
                <span style={{ fontSize: 16 }}>{isCompleted(g.id) ? '✅' : '⬜'}</span>
              </div>
            ))
          }
          <Button size="sm" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/wellness')}>Manage Goals →</Button>
        </Card>

        <Card>
          <CardTitle>Today's Food Log</CardTitle>
          {todayLogs.length === 0
            ? <EmptyState icon="🍽" message="Nothing logged yet today" />
            : todayLogs.slice(0, 5).map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14 }}>{f.name}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--coral2)' }}>{f.calories} kcal</span>
              </div>
            ))
          }
          <Button size="sm" style={{ marginTop: 10, width: '100%' }} onClick={() => navigate('/nutrition')}>Log Food →</Button>
        </Card>
      </Grid>

      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '+ Transaction', path: '/finance'   },
            { label: '+ Food Entry',  path: '/nutrition' },
            { label: '✓ Goals',       path: '/wellness'  },
            { label: '+ Workout',     path: '/workout'   },
            { label: '✍ Journal',    path: '/journal'   },
          ].map(a => <Button key={a.path} size="sm" onClick={() => navigate(a.path)}>{a.label}</Button>)}
        </div>
      </Card>
    </div>
  )
}
