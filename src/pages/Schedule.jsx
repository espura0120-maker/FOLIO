import { useState, useEffect, useCallback, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
         addDays, addMonths, subMonths, addWeeks, subWeeks,
         isSameMonth, isToday, parseISO, differenceInDays,
         addYears, getDay, getDate, getMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const EVENT_COLORS = {
  finance:  { bg:'rgba(245,200,66,0.18)',  text:'#f5c842', dot:'#f5c842',  border:'rgba(245,200,66,0.40)'  },
  workout:  { bg:'rgba(138,110,216,0.18)', text:'#a88ef0', dot:'#8a6ed8',  border:'rgba(138,110,216,0.40)' },
  reminder: { bg:'rgba(232,98,74,0.18)',   text:'#f07a62', dot:'#e8624a',  border:'rgba(232,98,74,0.40)'   },
  health:   { bg:'rgba(74,123,224,0.18)',  text:'#6a96f0', dot:'#4a7be0',  border:'rgba(74,123,224,0.40)'  },
  personal: { bg:'rgba(245,200,66,0.18)',  text:'#f5c842', dot:'#f5c842',  border:'rgba(245,200,66,0.40)'  },
  work:     { bg:'rgba(29,158,117,0.18)',  text:'#5dcaa5', dot:'#1d9e75',  border:'rgba(29,158,117,0.40)'  },
}

const RECUR_LABELS = { none:'Does not repeat', daily:'Every day', weekly:'Every week', biweekly:'Every 2 weeks', monthly:'Every month', yearly:'Every year' }

const DAYS    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_H   = 52
const START_H = 6
const END_H   = 23
const HOURS   = Array.from({ length: END_H - START_H }, (_, i) => i + START_H)

function parseTime(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function timeLabel(e) {
  if (e.all_day) return 'All day'
  if (e.start_time && e.end_time) return e.start_time + ' – ' + e.end_time
  return ''
}

function expandRecurring(event, rangeStart, rangeEnd) {
  if (!event.recurrence || event.recurrence === 'none') return [event]
  const results   = []
  const recurEnd  = event.recurrence_end ? parseISO(event.recurrence_end) : addYears(rangeEnd, 1)
  const eventDate = parseISO(event.date)
  let current     = new Date(eventDate)
  const stepMap = {
    daily:    d => addDays(d, 1),
    weekly:   d => addDays(d, 7),
    biweekly: d => addDays(d, 14),
    monthly:  d => addMonths(d, 1),
    yearly:   d => addYears(d, 1),
  }
  const step = stepMap[event.recurrence]
  if (!step) return [event]
  let safety = 0
  while (current <= rangeEnd && current <= recurEnd && safety < 500) {
    safety++
    if (current >= rangeStart) {
      const dateKey = format(current, 'yyyy-MM-dd')
      let virtualEndDate = dateKey
      if (event.end_date && event.end_date !== event.date) {
        const offset = differenceInDays(parseISO(event.end_date), parseISO(event.date))
        virtualEndDate = format(addDays(current, offset), 'yyyy-MM-dd')
      }
      results.push({ ...event, date: dateKey, end_date: virtualEndDate, _virtual: true, _parentId: event.id })
    }
    current = step(current)
  }
  return results
}

function expandAll(events, rangeStart, rangeEnd) {
  return events.flatMap(e => expandRecurring(e, rangeStart, rangeEnd))
}

function eventSpansDay(event, dateKey) {
  const end = event.end_date || event.date
  return event.date <= dateKey && end >= dateKey
}

function useScheduleEvents() {
  const { user } = useAuth()
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('schedule_events').select('*')
      .order('date', { ascending: true }).order('start_time', { ascending: true })
    setEvents(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function addEvent(payload) {
    const { data, error } = await supabase.from('schedule_events').insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setEvents(prev => [...prev, data])
  }
  async function updateEvent(id, payload) {
    const { data, error } = await supabase.from('schedule_events').update(payload).eq('id', id).select().single()
    if (!error) setEvents(prev => prev.map(e => e.id === id ? data : e))
  }
  async function deleteEvent(id) {
    await supabase.from('schedule_events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  return { events, loading, addEvent, updateEvent, deleteEvent }
}

function MonthView({ current, events, onEdit }) {
  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const gridStart  = startOfWeek(monthStart)
  const gridEnd    = endOfWeek(monthEnd)
  const expanded   = useMemo(() => expandAll(events, gridStart, gridEnd), [events, current])
  const days = []
  let d = gridStart
  while (d <= gridEnd) { days.push(d); d = addDays(d, 1) }

  function getMultiDayEvents() {
    return expanded.filter(e => { const end = e.end_date || e.date; return end > e.date && !e.all_day })
  }
  function getSingleDayEvents(dateKey) {
    return expanded.filter(e => {
      if (e.all_day) return false
      const end = e.end_date || e.date
      if (end > e.date) return false
      return e.date === dateKey
    })
  }
  const multiDay = getMultiDayEvents()

  return (
    <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'#12131a' }}>
        {DAYS.map(day => (
          <div key={day} style={{ padding:'10px 4px', textAlign:'center', fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.30)', letterSpacing:'0.07em', textTransform:'uppercase', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>{day}</div>
        ))}
      </div>
      {Array.from({ length: days.length / 7 }, (_, weekIdx) => {
        const weekDays = days.slice(weekIdx * 7, weekIdx * 7 + 7)
        return (
          <div key={weekIdx} style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'rgba(255,255,255,0.06)' }}>
            {weekDays.map((day, di) => {
              const dateKey    = format(day, 'yyyy-MM-dd')
              const otherMonth = !isSameMonth(day, current)
              const today      = isToday(day)
              const allDayEvts = expanded.filter(e => e.all_day && eventSpansDay(e, dateKey))
              const singleEvts = getSingleDayEvents(dateKey)
              const spanEvts   = multiDay.filter(e => {
                if (e.all_day) return false
                const end = e.end_date || e.date
                return e.date <= dateKey && end >= dateKey
              })
              return (
                <div key={di} style={{ background:otherMonth?'#0e0f16':'#1c1e2b', minHeight:90, padding:'6px 4px 4px', borderRight:di<6?'1px solid rgba(255,255,255,0.06)':'none', borderBottom:'1px solid rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ marginBottom:4, display:'flex', justifyContent:'center', alignItems:'center', gap:4 }}>
                    {today
                      ? <span style={{ background:'#f5c842', color:'#1a1400', width:24, height:24, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800 }}>{format(day,'d')}</span>
                      : <span style={{ fontSize:12, fontWeight:500, color:otherMonth?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.55)' }}>{format(day,'d')}</span>
                    }
                  </div>
                  {allDayEvts.map(e => {
                    const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                    const end = e.end_date || e.date
                    const isStart = e.date === dateKey, isEnd = end === dateKey, isMulti = end !== e.date
                    return (
                      <div key={e.id+dateKey} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ background:c.bg, color:c.text, borderRadius:isMulti?(isStart?'4px 0 0 4px':isEnd?'0 4px 4px 0':'0'):4, padding:'2px 5px', fontSize:10, fontWeight:600, marginBottom:2, cursor:'pointer', borderLeft:isStart||!isMulti?'2px solid '+c.dot:'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginLeft:isStart||!isMulti?0:-4, marginRight:isEnd||!isMulti?0:-4 }}>
                        {isStart||!isMulti ? e.title : ''}
                      </div>
                    )
                  })}
                  {spanEvts.map(e => {
                    const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                    const end = e.end_date || e.date
                    const isStart = e.date === dateKey, isEnd = end === dateKey
                    return (
                      <div key={e.id+dateKey+'span'} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ background:c.bg, color:c.text, borderRadius:isStart?'4px 0 0 4px':isEnd?'0 4px 4px 0':0, padding:'2px 5px', fontSize:10, fontWeight:600, marginBottom:2, cursor:'pointer', borderLeft:isStart?'2px solid '+c.dot:'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginLeft:isStart?0:-4, marginRight:isEnd?0:-4 }}>
                        {isStart ? e.title : ''}
                      </div>
                    )
                  })}
                  {singleEvts.map(e => {
                    const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                    return (
                      <div key={e.id+dateKey} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ background:c.bg, color:c.text, borderLeft:'2px solid '+c.dot, borderRadius:'0 4px 4px 0', padding:'2px 5px', fontSize:10, fontWeight:600, marginBottom:2, cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {e.start_time?e.start_time.slice(0,5)+' ':''}{e.title}{e.recurrence&&e.recurrence!=='none'?' 🔁':''}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function WeekView({ current, events, onEdit }) {
  const weekStart = startOfWeek(current)
  const weekEnd   = endOfWeek(current)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const expanded  = useMemo(() => expandAll(events, weekStart, weekEnd), [events, current])
  const totalH    = (END_H - START_H) * DAY_H

  function getEventStyle(e) {
    if (e.all_day) return null
    const startMins = parseTime(e.start_time), endMins = parseTime(e.end_time)
    if (startMins === null) return null
    const duration = endMins ? Math.max(endMins - startMins, 30) : 60
    return { top: ((startMins - START_H * 60) / 60) * DAY_H, height: (duration / 60) * DAY_H }
  }

  return (
    <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', background:'#12131a', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div />
        {weekDays.map((day, i) => (
          <div key={i} style={{ padding:'10px 4px', textAlign:'center', borderLeft:'1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.30)', letterSpacing:'0.07em', textTransform:'uppercase' }}>{DAYS[i]}</div>
            <div style={{ fontSize:18, fontWeight:700, color:isToday(day)?'#f5c842':'rgba(255,255,255,0.80)', marginTop:2 }}>{format(day,'d')}</div>
          </div>
        ))}
      </div>
      {expanded.some(e => e.all_day) && (
        <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', background:'#12131a', borderBottom:'1px solid rgba(255,255,255,0.07)', minHeight:28 }}>
          <div style={{ padding:'4px 6px', fontSize:10, color:'rgba(255,255,255,0.28)', textAlign:'right', borderRight:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'flex-end' }}>all day</div>
          {weekDays.map((day, di) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            return (
              <div key={di} style={{ borderLeft:'1px solid rgba(255,255,255,0.07)', padding:'2px 3px' }}>
                {expanded.filter(e => e.all_day && eventSpansDay(e, dateKey)).map(e => {
                  const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                  const end = e.end_date || e.date
                  const isStart = e.date === dateKey, isEnd = end === dateKey, isMulti = end !== e.date
                  return (
                    <div key={e.id+dateKey} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ background:c.bg, color:c.text, fontSize:10, fontWeight:600, padding:'2px 5px', cursor:'pointer', borderRadius:isMulti?(isStart?'4px 0 0 4px':isEnd?'0 4px 4px 0':0):4, borderLeft:isStart||!isMulti?'2px solid '+c.dot:'none', marginLeft:isStart||!isMulti?0:-3, marginRight:isEnd||!isMulti?0:-3, whiteSpace:'nowrap', overflow:'hidden' }}>
                      {isStart||!isMulti?e.title:''}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
      <div style={{ overflowY:'auto', maxHeight:520, background:'#1c1e2b' }}>
        <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', position:'relative' }}>
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height:DAY_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'4px 8px 0 0', borderRight:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)', lineHeight:1 }}>{h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'}</span>
              </div>
            ))}
          </div>
          {weekDays.map((day, di) => {
            const dateKey   = format(day, 'yyyy-MM-dd')
            const dayEvents = expanded.filter(e => !e.all_day && eventSpansDay(e, dateKey))
            return (
              <div key={di} style={{ position:'relative', height:totalH, borderLeft:'1px solid rgba(255,255,255,0.07)' }}>
                {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-START_H)*DAY_H, left:0, right:0, height:DAY_H, borderBottom:'1px solid rgba(255,255,255,0.05)' }} />)}
                {dayEvents.map(e => {
                  const c   = EVENT_COLORS[e.category] || EVENT_COLORS.personal
                  const pos = getEventStyle(e)
                  if (!pos) return null
                  const end = e.end_date || e.date
                  const isStart = e.date === dateKey, isEnd = end === dateKey, isMulti = end !== e.date
                  const top    = isMulti && !isStart ? 0 : pos.top
                  const height = isMulti && !isEnd ? totalH - top : pos.height
                  return (
                    <div key={e.id+dateKey} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ position:'absolute', top:top+1, left:3, right:3, height:Math.max(height-2,20), background:c.bg, borderLeft:'3px solid '+c.dot, borderRadius:'0 6px 6px 0', padding:'3px 6px', cursor:'pointer', overflow:'hidden', zIndex:1, transition:'opacity 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                      <div style={{ fontSize:11, fontWeight:700, color:c.text, lineHeight:1.3 }}>{e.title}{e.recurrence&&e.recurrence!=='none'?' 🔁':''}</div>
                      {height > 30 && <div style={{ fontSize:10, color:c.text, opacity:0.75, marginTop:2 }}>{timeLabel(e)}</div>}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DayView({ current, events, onEdit }) {
  const dateKey  = format(current, 'yyyy-MM-dd')
  const dayStart = parseISO(dateKey)
  const expanded = useMemo(() => expandAll(events, addDays(dayStart,-1), addDays(dayStart,1)), [events, dateKey])
  const dayEvents = expanded.filter(e => eventSpansDay(e, dateKey))
  const allDay    = dayEvents.filter(e => e.all_day)
  const timed     = dayEvents.filter(e => !e.all_day)
  const totalH    = (END_H - START_H) * DAY_H

  function getEventStyle(e) {
    const sm = parseTime(e.start_time), em = parseTime(e.end_time)
    if (sm === null) return null
    const dur = em ? Math.max(em - sm, 30) : 60
    return { top: ((sm - START_H * 60) / 60) * DAY_H, height: (dur / 60) * DAY_H }
  }

  return (
    <div style={{ borderRadius:16, overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ background:'#12131a', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:36, fontWeight:800, color:isToday(current)?'#f5c842':'#fff', lineHeight:1 }}>{format(current,'d')}</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.45)', marginTop:3 }}>{format(current,'EEEE, MMMM yyyy')}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:22, fontWeight:700 }}>{dayEvents.length}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>events</div>
        </div>
      </div>
      {allDay.length > 0 && (
        <div style={{ background:'#12131a', padding:'8px 16px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          {allDay.map(e => {
            const c = EVENT_COLORS[e.category] || EVENT_COLORS.personal
            return (
              <div key={e.id} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ background:c.bg, borderLeft:'3px solid '+c.dot, borderRadius:'0 8px 8px 0', padding:'7px 12px', marginBottom:4, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:13, fontWeight:700, color:c.text }}>{e.title}{e.recurrence&&e.recurrence!=='none'?' 🔁':''}</div>
                <div style={{ fontSize:11, color:c.text, opacity:0.7 }}>All day</div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ overflowY:'auto', maxHeight:520, background:'#1c1e2b' }}>
        <div style={{ display:'grid', gridTemplateColumns:'56px 1fr', position:'relative' }}>
          <div>
            {HOURS.map(h => (
              <div key={h} style={{ height:DAY_H, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'4px 10px 0 0', borderRight:'1px solid rgba(255,255,255,0.07)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.28)', lineHeight:1 }}>{h<12?h+' AM':h===12?'12 PM':(h-12)+' PM'}</span>
              </div>
            ))}
          </div>
          <div style={{ position:'relative', height:totalH }}>
            {HOURS.map(h => <div key={h} style={{ position:'absolute', top:(h-START_H)*DAY_H, left:0, right:0, height:DAY_H, borderBottom:'1px solid rgba(255,255,255,0.05)' }} />)}
            {timed.map(e => {
              const c   = EVENT_COLORS[e.category] || EVENT_COLORS.personal
              const pos = getEventStyle(e)
              if (!pos) return null
              const end = e.end_date || e.date
              const isStart = e.date === dateKey, isEnd = end === dateKey, isMulti = end !== e.date
              const top    = isMulti && !isStart ? 0 : pos.top
              const height = isMulti && !isEnd ? totalH - top : pos.height
              return (
                <div key={e.id} onClick={() => onEdit(e._virtual?{...e,id:e._parentId}:e)} style={{ position:'absolute', top:top+2, left:6, right:6, height:Math.max(height-4,24), background:c.bg, borderLeft:'3px solid '+c.dot, borderRadius:'0 8px 8px 0', padding:'6px 12px', cursor:'pointer', overflow:'hidden', transition:'opacity 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                  <div style={{ fontSize:13, fontWeight:700, color:c.text }}>{e.title}{e.recurrence&&e.recurrence!=='none'?' 🔁':''}</div>
                  {height > 32 && <div style={{ fontSize:11, color:c.text, opacity:0.75, marginTop:2 }}>{timeLabel(e)}{e.note?' · '+e.note:''}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function EventModal({ event, onSave, onDelete, onClose }) {
  const isNew = !event.id
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title:          event.title          || '',
    category:       event.category       || 'personal',
    date:           event.date           || format(new Date(), 'yyyy-MM-dd'),
    end_date:       event.end_date       || event.date || format(new Date(), 'yyyy-MM-dd'),
    start_time:     event.start_time     || '09:00',
    end_time:       event.end_time       || '10:00',
    all_day:        event.all_day        || false,
    multi_day:      event.multi_day      || (event.end_date && event.end_date !== event.date) || false,
    note:           event.note           || '',
    recurrence:     event.recurrence     || 'none',
    recurrence_end: event.recurrence_end || '',
  })
  const set    = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggle = k => setForm(f => ({ ...f, [k]: !f[k] }))

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(event.id || null, {
      title:          form.title,
      category:       form.category,
      date:           form.date,
      end_date:       form.multi_day ? form.end_date : form.date,
      start_time:     form.all_day ? null : form.start_time,
      end_time:       form.all_day ? null : form.end_time,
      all_day:        form.all_day,
      multi_day:      form.multi_day,
      note:           form.note,
      recurrence:     form.recurrence,
      recurrence_end: form.recurrence !== 'none' && form.recurrence_end ? form.recurrence_end : null,
    })
    setSaving(false)
    onClose()
  }

  const C = EVENT_COLORS

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.80)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div style={{ background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.10)', borderRadius:22, padding:26, width:'100%', maxWidth:440, maxHeight:'92vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#fff' }}>{isNew ? 'Add Event' : 'Edit Event'}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.40)', fontSize:22, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>Event title</label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Team meeting" autoFocus />
          </div>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:8, fontWeight:700 }}>Category</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {Object.entries(C).map(([cat, c]) => (
                <button key={cat} type="button" onClick={() => setForm(f=>({...f,category:cat}))} style={{ padding:'5px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', transition:'all 0.15s', border:form.category===cat?'1px solid '+c.dot:'1px solid rgba(255,255,255,0.09)', background:form.category===cat?c.bg:'#222435', color:form.category===cat?c.text:'rgba(255,255,255,0.45)' }}>{cat}</button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
              <input type="checkbox" checked={form.all_day} onChange={()=>toggle('all_day')} style={{ width:16, height:16, accentColor:'#f5c842', cursor:'pointer' }} />
              All day
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
              <input type="checkbox" checked={form.multi_day} onChange={()=>toggle('multi_day')} style={{ width:16, height:16, accentColor:'#f5c842', cursor:'pointer' }} />
              Multiple days
            </label>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1 }}>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>{form.multi_day?'Start date':'Date'}</label>
              <input type="date" value={form.date} onChange={set('date')} style={{ colorScheme:'dark' }} />
            </div>
            {form.multi_day && (
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>End date</label>
                <input type="date" value={form.end_date} onChange={set('end_date')} min={form.date} style={{ colorScheme:'dark' }} />
              </div>
            )}
          </div>
          {!form.all_day && (
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>Start time</label>
                <input type="time" value={form.start_time} onChange={set('start_time')} style={{ colorScheme:'dark' }} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>End time</label>
                <input type="time" value={form.end_time} onChange={set('end_time')} style={{ colorScheme:'dark' }} />
              </div>
            </div>
          )}
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:8, fontWeight:700 }}>Repeat</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(RECUR_LABELS).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setForm(f=>({...f,recurrence:val}))} style={{ padding:'6px 12px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s', border:form.recurrence===val?'1px solid rgba(245,200,66,0.40)':'1px solid rgba(255,255,255,0.09)', background:form.recurrence===val?'rgba(245,200,66,0.14)':'#222435', color:form.recurrence===val?'#f5c842':'rgba(255,255,255,0.45)' }}>
                  {val === 'none' ? '—' : '🔁'} {label}
                </button>
              ))}
            </div>
          </div>
          {form.recurrence && form.recurrence !== 'none' && (
            <div>
              <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>Repeat until (optional)</label>
              <input type="date" value={form.recurrence_end} onChange={set('recurrence_end')} min={form.date} style={{ colorScheme:'dark' }} />
            </div>
          )}
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.40)', display:'block', marginBottom:5, fontWeight:700 }}>Note (optional)</label>
            <input value={form.note} onChange={set('note')} placeholder="e.g. Meeting room 3" />
          </div>
          <button onClick={handleSave} disabled={saving} style={{ padding:'12px 16px', background:'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:14, fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', width:'100%', opacity:saving?0.7:1 }}>
            {saving ? 'Saving...' : isNew ? 'Save Event' : 'Save Changes'}
          </button>
          {!isNew && (
            <button onClick={async()=>{ await onDelete(event.id); onClose() }} style={{ padding:'10px', background:'rgba(232,98,74,0.10)', border:'1px solid rgba(232,98,74,0.22)', borderRadius:12, color:'#f07a62', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit', width:'100%' }}>Delete Event</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Schedule() {
  const [view, setView]             = useState('month')
  const [current, setCurrent]       = useState(new Date())
  const [modalEvent, setModalEvent] = useState(null)
  const { events, loading, addEvent, updateEvent, deleteEvent } = useScheduleEvents()

  async function handleSave(id, payload) {
    if (id) await updateEvent(id, payload)
    else    await addEvent(payload)
  }

  function navigate(dir) {
    if (view==='month')     setCurrent(dir>0?addMonths(current,1):subMonths(current,1))
    else if (view==='week') setCurrent(dir>0?addWeeks(current,1):subWeeks(current,1))
    else                    setCurrent(addDays(current,dir))
  }

  function headerLabel() {
    if (view==='month') return format(current,'MMMM yyyy')
    if (view==='week')  return format(startOfWeek(current),'MMM d') + ' – ' + format(endOfWeek(current),'MMM d, yyyy')
    return format(current,'EEEE, MMMM d')
  }

  return (
    <div className="fade-up">
      {modalEvent && <EventModal event={modalEvent} onSave={handleSave} onDelete={deleteEvent} onClose={()=>setModalEvent(null)} />}

      <SectionHeader title="Schedule" sub="Plan your days, weeks & months" accentColor="#3db88a" />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>navigate(-1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'rgba(255,255,255,0.60)', fontSize:13, fontWeight:600, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit' }}>← Prev</button>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff', minWidth:200, textAlign:'center' }}>{headerLabel()}</span>
          <button onClick={()=>navigate(1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'rgba(255,255,255,0.60)', fontSize:13, fontWeight:600, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit' }}>Next →</button>
          <button onClick={()=>setCurrent(new Date())} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.09)', borderRadius:10, color:'rgba(255,255,255,0.38)', fontSize:12, padding:'7px 12px', cursor:'pointer', fontFamily:'inherit' }}>Today</button>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3, gap:2 }}>
            {['Day','Week','Month'].map(v => (
              <button key={v} onClick={()=>setView(v.toLowerCase())} style={{ padding:'7px 16px', borderRadius:8, border:'none', fontFamily:'inherit', background:view===v.toLowerCase()?'#f5c842':'transparent', color:view===v.toLowerCase()?'#1a1400':'rgba(255,255,255,0.45)', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.18s' }}>{v}</button>
            ))}
          </div>
          <button onClick={()=>setModalEvent({ date:format(current,'yyyy-MM-dd') })} style={{ background:'#f5c842', border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:700, padding:'8px 16px', cursor:'pointer', fontFamily:'inherit' }}>+ Add Event</button>
        </div>
      </div>

      {loading
        ? <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={28} /></div>
        : <>
          {view==='month' && <MonthView current={current} events={events} onEdit={setModalEvent} />}
          {view==='week'  && <WeekView  current={current} events={events} onEdit={setModalEvent} />}
          {view==='day'   && <DayView   current={current} events={events} onEdit={setModalEvent} />}
        </>
      }

      <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap', alignItems:'center' }}>
        {Object.entries(EVENT_COLORS).map(([cat,c]) => (
          <div key={cat} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.38)', fontWeight:600 }}>
            <div style={{ width:8, height:8, borderRadius:2, background:c.dot }} />
            <span style={{ textTransform:'capitalize' }}>{cat}</span>
          </div>
        ))}
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginLeft:'auto' }}>🔁 = recurring</div>
      </div>
    </div>
  )
}
