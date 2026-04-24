import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const F  = "'Plus Jakarta Sans',sans-serif"
const FM = "'JetBrains Mono',monospace"

const RESULT_TYPES = {
  journal:     { label:'Journal',     color:'#6a96f0', icon:'✍️',  route:'/journal' },
  transaction: { label:'Finance',     color:'#f5c842', icon:'💰',  route:'/finance' },
  schedule:    { label:'Schedule',    color:'#5dd4a6', icon:'📅',  route:'/schedule' },
  media:       { label:'Media',       color:'#a88ef0', icon:'🎬',  route:'/media' },
  daily_log:   { label:'Daily Log',   color:'#f5c842', icon:'✦',   route:'/daily-log' },
}

function highlight(text, query) {
  if (!query || !text) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, 80)
  const start = Math.max(0, idx - 20)
  const end   = Math.min(text.length, idx + query.length + 40)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < text.length ? '...' : ''
  return prefix + text.slice(start, idx) + '**' + text.slice(idx, idx+query.length) + '**' + text.slice(idx+query.length, end) + suffix
}

function HighlightText({ text, query }) {
  if (!text) return null
  const parts = text.split('**')
  return (
    <span>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <mark key={i} style={{ background:'rgba(245,200,66,0.25)', color:'#f5c842', borderRadius:3, padding:'0 2px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

export function GlobalSearch({ onClose }) {
  const { user }    = useAuth()
  const navigate    = useNavigate()
  const [query, setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef(null)
  const timer    = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer.current)
  }, [query])

  useEffect(() => { setSelected(0) }, [results])

  const search = useCallback(async (q) => {
    if (!user) return
    setLoading(true)
    const like = `%${q}%`

    const [journal, txs, schedule, media, dailyLog] = await Promise.all([
      supabase.from('journal_entries').select('id,date,gratitude,intentions,body,mood,created_at').or(`gratitude.ilike.${like},intentions.ilike.${like},body.ilike.${like}`).limit(5),
      supabase.from('transactions').select('id,description,amount,type,category,date').ilike('description', like).limit(5),
      supabase.from('schedule_events').select('id,title,date,category,start_time').ilike('title', like).limit(5),
      supabase.from('media_logs').select('id,title,subtitle,type,status,rating').ilike('title', like).limit(5),
      supabase.from('daily_log_entries').select('id,text,type,date,completed').ilike('text', like).limit(5),
    ])

    const all = [
      ...(journal.data||[]).map(r => ({
        id: r.id, type:'journal', date: r.date || r.created_at?.slice(0,10),
        title: `Journal — ${r.date ? format(new Date(r.date+'T12:00:00'),'MMM d, yyyy') : ''}`,
        snippet: highlight([r.gratitude,r.intentions,r.body].filter(Boolean).join(' '), q),
        meta: r.mood || '',
      })),
      ...(txs.data||[]).map(r => ({
        id: r.id, type:'transaction', date: r.date,
        title: r.description,
        snippet: `${r.category} · ${r.date}`,
        meta: (r.type==='expense'?'-':'+')+Math.abs(+r.amount).toFixed(2),
        metaColor: r.type==='income'?'#5dd4a6':'#f07a62',
      })),
      ...(schedule.data||[]).map(r => ({
        id: r.id, type:'schedule', date: r.date,
        title: r.title,
        snippet: `${r.category||''} · ${r.date}${r.start_time?' · '+r.start_time.slice(0,5):''}`,
        meta: r.category || '',
      })),
      ...(media.data||[]).map(r => ({
        id: r.id, type:'media', date: '',
        title: r.title,
        snippet: `${r.subtitle||''} · ${r.type} · ${r.status}`,
        meta: r.rating ? '★ '+r.rating : '',
      })),
      ...(dailyLog.data||[]).map(r => ({
        id: r.id, type:'daily_log', date: r.date,
        title: r.text.slice(0, 60) + (r.text.length > 60 ? '...' : ''),
        snippet: `Daily Log · ${r.date} · ${r.type}`,
        meta: r.completed ? '✓' : '',
      })),
    ]

    setResults(all)
    setLoading(false)
  }, [user])

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s+1, results.length-1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s-1, 0)) }
    if (e.key === 'Enter' && results[selected]) { goTo(results[selected]) }
    if (e.key === 'Escape') { onClose() }
  }

  function goTo(result) {
    const type = RESULT_TYPES[result.type]
    if (type) navigate(type.route)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:500, padding:'80px 20px 20px', backdropFilter:'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width:'100%', maxWidth:580, background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, overflow:'hidden', boxShadow:'0 30px 80px rgba(0,0,0,0.7)' }}>
        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search journal, finance, schedule, media..." autoComplete="off"
            style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:16, outline:'none', fontFamily:F }} />
          {loading && <div style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.15)', borderTopColor:'rgba(255,255,255,0.55)', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />}
          <kbd style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:6, padding:'2px 7px', fontSize:11, color:'rgba(255,255,255,0.38)', cursor:'pointer' }} onClick={onClose}>esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:420, overflowY:'auto' }}>
          {query.length < 2 ? (
            <div style={{ padding:'28px 20px', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:8, opacity:0.3 }}>✦</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.35)' }}>Search across all your data</div>
              <div style={{ display:'flex', gap:10, justifyContent:'center', marginTop:14, flexWrap:'wrap' }}>
                {Object.entries(RESULT_TYPES).map(([k,v]) => (
                  <span key={k} style={{ fontSize:11, background:v.color+'14', border:'1px solid '+v.color+'30', borderRadius:7, padding:'3px 9px', color:v.color }}>
                    {v.icon} {v.label}
                  </span>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding:'32px 20px', textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.35)' }}>
              No results for "{query}"
            </div>
          ) : (
            results.map((r, i) => {
              const type = RESULT_TYPES[r.type]
              return (
                <div key={r.id+r.type} onClick={() => goTo(r)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 18px', cursor:'pointer', background:selected===i?'rgba(255,255,255,0.07)':'transparent', borderLeft:`2px solid ${selected===i?type.color:'transparent'}`, transition:'all 0.1s' }}
                  onMouseEnter={() => setSelected(i)}>
                  <div style={{ width:34, height:34, borderRadius:9, background:type.color+'18', border:'1px solid '+type.color+'30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{type.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{r.title}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.38)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      <HighlightText text={r.snippet} query={query} />
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                    {r.meta && <span style={{ fontFamily:FM, fontSize:12, color:r.metaColor||type.color }}>{r.meta}</span>}
                    <span style={{ fontSize:9, background:type.color+'14', border:'1px solid '+type.color+'25', borderRadius:5, padding:'1px 6px', color:type.color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{type.label}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'8px 18px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:14, fontSize:11, color:'rgba(255,255,255,0.28)' }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
          {results.length > 0 && <span style={{ marginLeft:'auto' }}>{results.length} results</span>}
        </div>
      </div>
    </div>
  )
}
