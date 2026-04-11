import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays, differenceInDays, parseISO,
         startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addMonths, subMonths, isSameMonth, isToday } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Card, CardTitle, StatCard, Grid, Button, EmptyState } from '@/components/shared/UI'

const PINK   = { bg: 'rgba(212,83,126,0.18)', border: 'rgba(212,83,126,0.30)', text: '#ed93b1', dot: '#d4537e' }
const TEAL   = { bg: 'rgba(29,158,117,0.15)',  border: 'rgba(29,158,117,0.28)',  text: '#5dcaa5', dot: '#1d9e75' }
const PURPLE = { bg: 'rgba(138,110,216,0.14)', border: 'rgba(138,110,216,0.26)', text: '#a88ef0', dot: '#8a6ed8' }

function useCycleLogs() {
  const { user } = useAuth()
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('cycle_logs')
      .select('*')
      .order('start_date', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addLog(payload) {
    const { data, error } = await supabase
      .from('cycle_logs')
      .insert({ ...payload, user_id: user.id })
      .select().single()
    if (!error) setLogs(prev => [data, ...prev])
    return { data, error }
  }

  async function updateLog(id, payload) {
    const { data, error } = await supabase
      .from('cycle_logs')
      .update(payload)
      .eq('id', id)
      .select().single()
    if (!error) setLogs(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }

  async function deleteLog(id) {
    await supabase.from('cycle_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, loading, addLog, updateLog, deleteLog, refresh: fetch }
}

function computeStats(logs) {
  if (!logs.length) return { avgCycle: 28, avgPeriod: 5, lastStart: null, nextStart: null, nextEnd: null }

  const sorted = [...logs].sort((a, b) => a.start_date.localeCompare(b.start_date))

  const periodLengths = sorted
    .filter(l => l.end_date)
    .map(l => differenceInDays(parseISO(l.end_date), parseISO(l.start_date)) + 1)
  const avgPeriod = periodLengths.length
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : 5

  const cycleLengths = []
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(parseISO(sorted[i].start_date), parseISO(sorted[i-1].start_date))
    if (diff > 10 && diff < 60) cycleLengths.push(diff)
  }
  const avgCycle = cycleLengths.length
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : 28

  const lastStart  = sorted[sorted.length - 1].start_date
  const nextStart  = format(addDays(parseISO(lastStart), avgCycle), 'yyyy-MM-dd')
  const nextEnd    = format(addDays(parseISO(nextStart), avgPeriod - 1), 'yyyy-MM-dd')

  return { avgCycle, avgPeriod, lastStart, nextStart, nextEnd }
}

function getDayType(dateKey, logs, stats) {
  const { avgCycle, avgPeriod, lastStart } = stats
  if (!lastStart) return 'normal'

  for (const log of logs) {
    const s = log.start_date
    const e = log.end_date || format(addDays(parseISO(s), 4), 'yyyy-MM-dd')
    if (dateKey >= s && dateKey <= e) return 'period'
  }

  if (stats.nextStart && dateKey >= stats.nextStart && dateKey <= stats.nextEnd) return 'predicted'

  const lastDate   = parseISO(lastStart)
  const dayOfCycle = differenceInDays(parseISO(dateKey), lastDate) % avgCycle
  const normalized = ((dayOfCycle % avgCycle) + avgCycle) % avgCycle

  const ovDay      = Math.round(avgCycle / 2) - 1
  if (normalized >= ovDay - 1 && normalized <= ovDay + 1) return 'ovulation'
  if (normalized >= ovDay - 4 && normalized <= ovDay + 2) return 'fertile'

  return 'normal'
}

function getCurrentPhase(stats) {
  const { avgCycle, avgPeriod, lastStart } = stats
  if (!lastStart) return null
  const dayOfCycle = differenceInDays(new Date(), parseISO(lastStart)) % avgCycle
  const norm       = ((dayOfCycle % avgCycle) + avgCycle) % avgCycle
  const ovDay      = Math.round(avgCycle / 2) - 1
  if (norm < avgPeriod) return { name: 'Period', day: norm + 1, color: PINK }
  if (norm < ovDay - 3) return { name: 'Follicular', day: norm + 1, color: TEAL }
  if (norm <= ovDay + 2) return { name: 'Ovulation', day: norm + 1, color: { bg: 'rgba(93,212,166,0.18)', border: 'rgba(93,212,166,0.30)', text: '#5dd4a6', dot: '#3db88a' } }
  return { name: 'Luteal', day: norm + 1, color: PURPLE }
}

function CycleCalendar({ current, logs, stats }) {
  const start = startOfWeek(startOfMonth(current))
  const end   = endOfWeek(endOfMonth(current))
  const days  = []
  let d = start
  while (d <= end) { days.push(d); d = addDays(d, 1) }
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'rgba(240,232,216,0.28)', padding: '4px 0', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {days.map((day, i) => {
          const key   = format(day, 'yyyy-MM-dd')
          const type  = getDayType(key, logs, stats)
          const other = !isSameMonth(day, current)
          const today = isToday(day)

          let bg = 'transparent', color = other ? 'rgba(240,232,216,0.15)' : 'rgba(240,232,216,0.45)', border = 'none', fontWeight = 400
          if (type === 'period')    { bg = 'rgba(212,83,126,0.28)';  color = '#ed93b1'; border = '1px solid rgba(212,83,126,0.40)'; fontWeight = 500 }
          if (type === 'ovulation') { bg = 'rgba(93,212,166,0.25)';  color = '#5dcaa5'; border = '1px solid rgba(93,212,166,0.38)' }
          if (type === 'fertile')   { bg = 'rgba(29,158,117,0.14)';  color = '#5dcaa5' }
          if (type === 'predicted') { bg = 'rgba(212,83,126,0.09)';  color = '#ed93b1'; border = '1px dashed rgba(212,83,126,0.35)' }

          return (
            <div key={i} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', fontSize: 12, fontWeight,
              background: bg, color, border,
              outline: today ? '2px solid rgba(201,153,58,0.65)' : 'none',
              outlineOffset: 1,
              color: today ? '#e8b84a' : color,
            }}>
              {format(day, 'd')}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LogModal({ existing, onSave, onClose }) {
  const isNew = !existing
  const [form, setForm] = useState({
    start_date: existing?.start_date || format(new Date(), 'yyyy-MM-dd'),
    end_date:   existing?.end_date   || '',
    notes:      existing?.notes      || '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSave() {
    if (!form.start_date) return
    setSaving(true)
    const payload = {
      start_date: form.start_date,
      end_date:   form.end_date || null,
      notes:      form.notes || null,
      cycle_length: null,
    }
    await onSave(existing?.id || null, payload)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22, padding: 26, width: '100%', maxWidth: 380, backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: '#ed93b1' }}>
            {isNew ? 'Log Period' : 'Edit Period'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,232,216,0.35)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6 }}>Period start date</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6 }}>Period end date (optional)</label>
            <input type="date" value={form.end_date} onChange={set('end_date')} min={form.start_date} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
            <input value={form.notes} onChange={set('notes')} placeholder="e.g. Heavy flow, cramps..." />
          </div>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '11px 16px', marginTop: 4, fontFamily: 'inherit',
            background: 'linear-gradient(135deg, #993556, #d4537e)',
            border: '1px solid rgba(212,83,126,0.30)',
            borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer', width: '100%',
            boxShadow: '0 0 22px rgba(212,83,126,0.32)',
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Saving...' : isNew ? 'Log Period' : 'Save Changes'}
          </button>
          {!isNew && (
            <button onClick={() => { onSave('delete', existing.id); onClose() }} style={{
              padding: '10px', fontFamily: 'inherit',
              background: 'rgba(217,100,74,0.10)', border: '1px solid rgba(217,100,74,0.22)',
              borderRadius: 12, color: '#f07a5e', fontSize: 14, cursor: 'pointer', width: '100%',
            }}>Delete Entry</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Cycle() {
  const { logs, loading, addLog, updateLog, deleteLog } = useCycleLogs()
  const [current, setCurrent]     = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editLog, setEditLog]     = useState(null)

  const stats  = computeStats(logs)
  const phase  = getCurrentPhase(stats)

  const daysUntilNext = stats.nextStart
    ? Math.max(0, differenceInDays(parseISO(stats.nextStart), new Date()))
    : null

  const currentDayOfCycle = stats.lastStart
    ? (differenceInDays(new Date(), parseISO(stats.lastStart)) % stats.avgCycle) + 1
    : null

  async function handleSave(id, payload) {
    if (id === 'delete') { await deleteLog(payload); return }
    if (id) await updateLog(id, payload)
    else await addLog(payload)
  }

  return (
    <div className="fade-up">
      {(showModal || editLog) && (
        <LogModal
          existing={editLog}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditLog(null) }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <h1 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 26, fontWeight: 400, color: '#ed93b1' }}>Cycle</h1>
          <p style={{ fontSize: 13, color: 'rgba(240,232,216,0.32)' }}>Track & predict your monthly cycle</p>
        </div>
        <button onClick={() => { setEditLog(null); setShowModal(true) }} style={{
          padding: '9px 16px', fontFamily: 'inherit',
          background: 'linear-gradient(135deg, #993556, #d4537e)',
          border: '1px solid rgba(212,83,126,0.28)',
          borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 0 18px rgba(212,83,126,0.28)',
        }}>+ Log Period</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(240,232,216,0.32)' }}>Loading...</div>
      ) : (
        <>
          <Grid cols={3} style={{ marginBottom: 14 }}>
            <StatCard label="Avg cycle" value={stats.avgCycle + ' days'} color="#e8b84a" />
            <StatCard label="Period length" value={stats.avgPeriod + ' days'} color="#ed93b1" />
            <StatCard label="Days until next" value={daysUntilNext !== null ? daysUntilNext + 'd' : '--'} color="#5dcaa5" />
          </Grid>

          <Grid cols={2} style={{ marginBottom: 14 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button onClick={() => setCurrent(subMonths(current, 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(240,232,216,0.55)', fontSize: 13, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Prev</button>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,232,216,0.80)' }}>{format(current, 'MMMM yyyy')}</div>
                <button onClick={() => setCurrent(addMonths(current, 1))} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(240,232,216,0.55)', fontSize: 13, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Next</button>
              </div>
              <CycleCalendar current={current} logs={logs} stats={stats} />
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {[['rgba(212,83,126,0.28)','Period'],['rgba(93,212,166,0.25)','Ovulation'],['rgba(29,158,117,0.14)','Fertile'],['rgba(212,83,126,0.09)','Predicted']].map(([bg, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(240,232,216,0.38)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: bg, border: label === 'Predicted' ? '1px dashed rgba(212,83,126,0.50)' : 'none' }} />
                    {label}
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {phase && (
                <Card>
                  <CardTitle>Current phase</CardTitle>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: phase.color.bg, border: '1px solid ' + phase.color.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {phase.name === 'Period' ? '🌸' : phase.name === 'Follicular' ? '🌱' : phase.name === 'Ovulation' ? '✨' : '🌙'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 500, color: phase.color.text }}>{phase.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', marginTop: 2 }}>Day {currentDayOfCycle} of cycle</div>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex' }}>
                    <div style={{ width: (stats.avgPeriod / stats.avgCycle * 100) + '%', background: '#d4537e', opacity: 0.7 }} />
                    <div style={{ width: '14%', background: '#1d9e75', opacity: 0.7 }} />
                    <div style={{ width: '14%', background: '#5dcaa5', opacity: 0.9 }} />
                    <div style={{ flex: 1, background: '#8a6ed8', opacity: 0.7 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: 'rgba(212,83,126,0.7)' }}>Period</span>
                    <span style={{ fontSize: 10, color: 'rgba(29,158,117,0.7)' }}>Follicular</span>
                    <span style={{ fontSize: 10, color: 'rgba(93,212,166,0.9)' }}>Ovulation</span>
                    <span style={{ fontSize: 10, color: 'rgba(138,110,216,0.7)' }}>Luteal</span>
                  </div>
                </Card>
              )}

              {stats.nextStart && (
                <div style={{ background: 'rgba(212,83,126,0.08)', border: '1px solid rgba(212,83,126,0.18)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212,83,126,0.15)', border: '1px solid rgba(212,83,126,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌸</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#ed93b1', marginBottom: 2 }}>Next period estimated</div>
                    <div style={{ fontSize: 12, color: 'rgba(212,83,126,0.60)' }}>
                      {format(parseISO(stats.nextStart), 'MMM d')} – {format(parseISO(stats.nextEnd), 'MMM d, yyyy')}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.30)', marginTop: 2 }}>in {daysUntilNext} days · based on {logs.length} log{logs.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )}

              {!logs.length && (
                <Card>
                  <EmptyState icon="🌸" message="Log your first period to start tracking and get predictions." />
                </Card>
              )}
            </div>
          </Grid>

          <Card>
            <CardTitle>Cycle History</CardTitle>
            {!logs.length
              ? <EmptyState icon="📋" message="No periods logged yet." />
              : logs.map((log, i) => {
                const len = log.end_date
                  ? differenceInDays(parseISO(log.end_date), parseISO(log.start_date)) + 1
                  : null
                const cycleLen = i < logs.length - 1
                  ? differenceInDays(parseISO(log.start_date), parseISO(logs[i + 1].start_date))
                  : null
                return (
                  <div key={log.id} onClick={() => setEditLog(log)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                    background: 'rgba(212,83,126,0.06)',
                    border: '1px solid rgba(212,83,126,0.12)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,83,126,0.11)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,83,126,0.06)'}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(212,83,126,0.18)', border: '1px solid rgba(212,83,126,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌸</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#ed93b1' }}>
                        {format(parseISO(log.start_date), 'MMMM d, yyyy')}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(240,232,216,0.38)', marginTop: 1 }}>
                        {len ? len + ' day period' : 'End date not set'}
                        {log.notes ? ' · ' + log.notes : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {cycleLen && cycleLen > 0 && cycleLen < 60 && (
                        <div style={{ fontSize: 12, color: '#e8b84a', fontFamily: 'JetBrains Mono, monospace' }}>{cycleLen}d cycle</div>
                      )}
                      <div style={{ fontSize: 11, color: 'rgba(240,232,216,0.28)', marginTop: 2 }}>tap to edit</div>
                    </div>
                  </div>
                )
              })
            }
          </Card>
        </>
      )}
    </div>
  )
}
