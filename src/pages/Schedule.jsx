import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addDays, addMonths, subMonths, addWeeks, subWeeks,
         isSameMonth, isToday } from 'date-fns'
import { SectionHeader } from '@/components/shared/UI'

const EVENT_COLORS = {
  finance:  { bg: 'rgba(201,153,58,0.2)',  text: '#e8b85a', dot: '#c9993a' },
  workout:  { bg: 'rgba(61,184,138,0.2)',  text: '#5dd4a6', dot: '#3db88a' },
  reminder: { bg: 'rgba(217,100,74,0.2)',  text: '#f07a5e', dot: '#d9644a' },
  health:   { bg: 'rgba(74,123,224,0.2)',  text: '#6a96f0', dot: '#4a7be0' },
  personal: { bg: 'rgba(138,110,216,0.2)', text: '#a88ef0', dot: '#8a6ed8' },
}

const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM']

const SAMPLE_EVENTS = [
  { id:1,  title: 'Morning workout',    category: 'workout',  date: '2026-04-09', hour: 7,  duration: 60,  note: 'Gym' },
  { id:2,  title: 'Doctor appointment', category: 'health',   date: '2026-04-09', hour: 9,  duration: 30,  note: 'Clinic' },
  { id:3,  title: 'Rent due',           category: 'reminder', date: '2026-04-10', hour: 9,  duration: 0,   note: 'Finance' },
  { id:4,  title: 'Salary day',         category: 'finance',  date: '2026-04-01', hour: 9,  duration: 0,   note: 'Income' },
  { id:5,  title: 'Gym session',        category: 'workout',  date: '2026-04-07', hour: 7,  duration: 60,  note: 'Push day' },
  { id:6,  title: 'Netflix',            category: 'personal', date: '2026-04-15', hour: 20, duration: 120, note: 'Subscription' },
  { id:7,  title: 'Gym session',        category: 'workout',  date: '2026-04-13', hour: 7,  duration: 60,  note: 'Pull day' },
  { id:8,  title: 'Weigh-in',           category: 'health',   date: '2026-04-21', hour: 8,  duration: 15,  note: 'Wellness' },
  { id:9,  title: 'Gym session',        category: 'workout',  date: '2026-04-20', hour: 7,  duration: 60,  note: 'Leg day' },
  { id:10, title: 'Bills reminder',     category: 'reminder', date: '2026-04-30', hour: 9,  duration: 0,   note: 'Finance' },
]

function EventPill({ event, small, onDelete }) {
  const c = EVENT_COLORS[event.category] || EVENT_COLORS.personal
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: c.bg, borderRadius: 3, marginBottom: 2, overflow: 'hidden' }}>
      <div style={{ flex: 1, color: c.text, padding: small ? '2px 5px' : '3px 7px', fontSize: small ? 10 : 11, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {event.title}
      </div>
      <button onClick={e => { e.stopPropagation(); onDelete(event.id) }}
        style={{ background: 'none', border: 'none', color: c.text, opacity: 0.7, cursor: 'pointer', padding: '0 5px', fontSize: small ? 12 : 14, lineHeight: 1, flexShrink: 0 }}>
        ×
      </button>
    </div>
  )
}

function MonthView({ current, events, onDelete }) {
  const start = startOfWeek(startOfMonth(current))
  const end   = endOfWeek(endOfMonth(current))
  const days  = []
  let d = start
  while (d <= end) { days.push(d); d = addDays(d, 1) }

  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg3)' }}>
        {DAYS.map(day => (
          <div key={day} style={{ padding: '8px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
            {day}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)' }}>
        {days.map((day, i) => {
          const dayKey    = format(day, 'yyyy-MM-dd')
          const dayEvents = events.filter(e => e.date === dayKey)
          const today     = isToday(day)
          const other     = !isSameMonth(day, current)
          return (
            <div key={i} style={{ background: other ? 'var(--bg)' : 'var(--bg2)', minHeight: 80, padding: 6 }}>
              <div style={{ marginBottom: 4 }}>
                {today
                  ? <span style={{ background: 'var(--gold)', color: '#1a1200', width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{format(day, 'd')}</span>
                  : <span style={{ fontSize: 12, color: other ? 'var(--text3)' : 'var(--text2)' }}>{format(day, 'd')}</span>
                }
              </div>
              {dayEvents.slice(0, 2).map(e => <EventPill key={e.id} event={e} small onDelete={onDelete} />)}
              {dayEvents.length > 2 && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>+{dayEvents.length - 2} more</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ current, events, onDelete }) {
  const weekStart = startOfWeek(current)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
        <div />
        {weekDays.map((day, i) => (
          <div key={i} style={{ padding: '8px 4px', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{DAYS[i]}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: isToday(day) ? 'var(--gold2)' : 'var(--text)', marginTop: 2 }}>{format(day, 'd')}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--bg2)' }}>
        {HOURS.map((hour, hi) => {
          const h = hi + 6
          return (
            <div key={hour} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid var(--border)', minHeight: 44 }}>
              <div style={{ padding: '6px 8px', fontSize: 10, color: 'var(--text3)', textAlign: 'right', borderRight: '1px solid var(--border)' }}>{hour}</div>
              {weekDays.map((day, di) => {
                const dayEvents = events.filter(e => e.date === format(day, 'yyyy-MM-dd') && e.hour === h)
                return (
                  <div key={di} style={{ padding: 2, borderLeft: '1px solid var(--border)', minHeight: 44 }}>
                    {dayEvents.map(e => <EventPill key={e.id} event={e} small onDelete={onDelete} />)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ current, events, onDelete }) {
  const dateKey   = format(current, 'yyyy-MM-dd')
  const dayEvents = events.filter(e => e.date === dateKey)
  return (
    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <div style={{ background: 'var(--bg3)', padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 36, color: isToday(current) ? 'var(--gold2)' : 'var(--text)', lineHeight: 1 }}>{format(current, 'd')}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{format(current, 'EEEE, MMMM yyyy')}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{dayEvents.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>events today</div>
        </div>
      </div>
      {HOURS.map((hour, hi) => {
        const h = hi + 6
        const slotEvents = events.filter(e => e.date === dateKey && e.hour === h)
        return (
          <div key={hour} style={{ display: 'flex', gap: 14, padding: '10px 16px 6px', borderBottom: '1px solid var(--border)', minHeight: 52, alignItems: 'flex-start', background: 'var(--bg2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', width: 40, flexShrink: 0, paddingTop: 2 }}>{hour}</div>
            <div style={{ flex: 1 }}>
              {slotEvents.map(e => {
                const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                return (
                  <div key={e.id} style={{ background: c.bg, borderRadius: 8, padding: '7px 12px', marginBottom: 4, borderLeft: `3px solid ${c.dot}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{e.note}{e.duration ? ` · ${e.duration} min` : ''}</div>
                    </div>
                    <button onClick={() => onDelete(e.id)}
                      style={{ background: 'none', border: 'none', color: c.text, opacity: 0.7, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AddEventModal({ defaultDate, onSave, onClose }) {
  const [form, setForm] = useState({ title: '', category: 'personal', date: defaultDate, hour: 9, duration: 60, note: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSave() {
    if (!form.title.trim()) return
    onSave({ ...form, id: Date.now(), hour: +form.hour, duration: +form.duration })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 20, color: 'var(--text)' }}>Add Event</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Event title</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Morning run" autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Date</label>
            <input type="date" value={form.date} onChange={set('date')} style={{ colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Time</label>
              <select value={form.hour} onChange={set('hour')}>
                {Array.from({ length: 16 }, (_, i) => i + 6).map(h => (
                  <option key={h} value={h}>{h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM`}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Duration (min)</label>
              <input type="number" value={form.duration} onChange={set('duration')} min={0} step={15} placeholder="0 = all day" />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 8 }}>Category</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(EVENT_COLORS).map(([cat, c]) => (
                <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))} style={{
                  padding: '6px 12px', border: `1px solid ${form.category === cat ? c.dot : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', background: form.category === cat ? c.bg : 'var(--bg3)',
                  color: form.category === cat ? c.text : 'var(--text3)',
                  fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.15s',
                }}>{cat}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>Note (optional)</label>
            <input value={form.note} onChange={set('note')} placeholder="e.g. Gym / Clinic / recurring" />
          </div>
          <button onClick={handleSave} style={{
            marginTop: 4, padding: '11px 16px',
            background: form.title.trim() ? 'var(--gold)' : 'var(--bg4)',
            border: 'none', borderRadius: 'var(--radius-sm)',
            color: form.title.trim() ? '#1a1200' : 'var(--text3)',
            fontSize: 14, fontWeight: 600,
            cursor: form.title.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit', width: '100%', transition: 'all 0.15s',
          }}>
            Save Event
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Schedule() {
  const [view, setView]         = useState('month')
  const [current, setCurrent]   = useState(new Date())
  const [events, setEvents]     = useState(SAMPLE_EVENTS)
  const [showModal, setShowModal] = useState(false)

  function navigate(dir) {
    if (view === 'month') setCurrent(dir > 0 ? addMonths(current, 1) : subMonths(current, 1))
    else if (view === 'week') setCurrent(dir > 0 ? addWeeks(current, 1) : subWeeks(current, 1))
    else setCurrent(addDays(current, dir))
  }

  function headerLabel() {
    if (view === 'month') return format(current, 'MMMM yyyy')
    if (view === 'week') {
      const ws = startOfWeek(current)
      const we = endOfWeek(current)
      return `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`
    }
    return format(current, 'EEEE, MMMM d')
  }

  return (
    <div className="fade-up">
      {showModal && (
        <AddEventModal
          defaultDate={format(current, 'yyyy-MM-dd')}
          onSave={ev => setEvents(prev => [...prev, ev])}
          onClose={() => setShowModal(false)}
        />
      )}

      <SectionHeader title="Schedule" sub="Plan your days, weeks & months" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>← Prev</button>
          <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', minWidth: 180, textAlign: 'center' }}>{headerLabel()}</span>
          <button onClick={() => navigate(1)} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text2)', fontSize: 13, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>Next →</button>
          <button onClick={() => setCurrent(new Date())} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text3)', fontSize: 12, padding: '6px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>Today</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 2 }}>
            {['Day','Week','Month'].map(v => (
              <button key={v} onClick={() => setView(v.toLowerCase())} style={{
                padding: '6px 14px', borderRadius: 'var(--radius-sm)', border: 'none',
                background: view === v.toLowerCase() ? 'var(--gold)' : 'transparent',
                color: view === v.toLowerCase() ? '#1a1200' : 'var(--text3)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>{v}</button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{
            background: 'var(--gold)', border: 'none', borderRadius: 'var(--radius-sm)',
            color: '#1a1200', fontSize: 13, fontWeight: 600, padding: '7px 14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>+ Add Event</button>
        </div>
      </div>

      {view === 'month' && <MonthView current={current} events={events} onDelete={id => setEvents(p => p.filter(e => e.id !== id))} />}
      {view === 'week'  && <WeekView  current={current} events={events} onDelete={id => setEvents(p => p.filter(e => e.id !== id))} />}
      {view === 'day'   && <DayView   current={current} events={events} onDelete={id => setEvents(p => p.filter(e => e.id !== id))} />}

      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
        {Object.entries(EVENT_COLORS).map(([cat, c]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c.dot }} />
            <span style={{ textTransform: 'capitalize' }}>{cat}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
