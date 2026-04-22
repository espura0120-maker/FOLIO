import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const OMDB_KEY = '43a78fde'
const FM = "'JetBrains Mono',monospace"

// ── Search functions ──────────────────────────────────────────────────────
async function searchMovies(query) {
  const r = await fetch('https://www.omdbapi.com/?s=' + encodeURIComponent(query) + '&type=movie&apikey=' + OMDB_KEY)
  const d = await r.json()
  if (d.Response === 'False') return []
  return (d.Search || []).slice(0, 8).map(item => ({
    external_id: item.imdbID || '',
    title:       item.Title  || '',
    subtitle:    '',
    year:        (item.Year || '').replace(/[^0-9]/g, '').slice(0, 4),
    poster_url:  item.Poster && item.Poster !== 'N/A' ? item.Poster : null,
    description: '', genre: '', type: 'movie',
  }))
}

async function searchTV(query) {
  const r = await fetch('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(query))
  const d = await r.json()
  return (d || []).slice(0, 8).map(item => {
    const s = item.show || item
    return {
      external_id: String(s.id || ''),
      title:       s.name || '',
      subtitle:    s.network?.name || s.webChannel?.name || '',
      year:        (s.premiered || '').slice(0, 4),
      poster_url:  s.image?.original || s.image?.medium || null,
      description: s.summary ? s.summary.replace(/<[^>]+>/g, '') : '',
      genre:       (s.genres || []).slice(0, 2).join(', '),
      type:        'tv',
    }
  }).filter(s => s.title)
}

async function searchBooks(query) {
  const r = await fetch('https://openlibrary.org/search.json?q=' + encodeURIComponent(query) + '&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject')
  const d = await r.json()
  return (d.docs || []).slice(0, 8).map(i => ({
    external_id: i.key || '',
    title:       i.title || '',
    subtitle:    i.author_name?.[0] || '',
    year:        String(i.first_publish_year || ''),
    poster_url:  i.cover_i ? 'https://covers.openlibrary.org/b/id/' + i.cover_i + '-M.jpg' : null,
    description: '', genre: (i.subject || []).slice(0, 3).join(', '), type: 'book',
  })).filter(b => b.title)
}

async function searchMusic(query) {
  const r = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&media=music&entity=album&limit=8&country=us')
  const d = await r.json()
  return (d.results || []).filter(i => i.collectionName).map(i => ({
    external_id: String(i.collectionId || ''),
    title:       i.collectionName || '',
    subtitle:    i.artistName || '',
    year:        (i.releaseDate || '').slice(0, 4),
    poster_url:  i.artworkUrl100 ? i.artworkUrl100.replace('100x100bb', '600x600bb') : null,
    description: '', genre: i.primaryGenreName || '', type: 'music',
  }))
}

// ── Config ────────────────────────────────────────────────────────────────
const CATS = [
  { type:'movie', label:'Movies',   icon:'🎬', color:'#6a96f0', searchFn: searchMovies,
    statuses: [
      { id:'completed',   label:'Watched',      color:'#5dd4a6' },
      { id:'want_to',     label:'Want to Watch', color:'#f5c842' },
      { id:'in_progress', label:'Watching',      color:'#6a96f0' },
      { id:'dropped',     label:'Dropped',       color:'#f07a62' },
    ]},
  { type:'tv', label:'TV Shows',  icon:'📺', color:'#a88ef0', searchFn: searchTV,
    statuses: [
      { id:'completed',   label:'Finished',      color:'#5dd4a6' },
      { id:'in_progress', label:'Watching',       color:'#6a96f0' },
      { id:'want_to',     label:'Want to Watch',  color:'#f5c842' },
      { id:'dropped',     label:'Dropped',        color:'#f07a62' },
    ]},
  { type:'book', label:'Books',    icon:'📚', color:'#5dd4a6', searchFn: searchBooks,
    statuses: [
      { id:'completed',   label:'Read',           color:'#5dd4a6' },
      { id:'in_progress', label:'Reading',         color:'#6a96f0' },
      { id:'want_to',     label:'Want to Read',    color:'#f5c842' },
      { id:'dropped',     label:'Dropped',         color:'#f07a62' },
    ]},
  { type:'music', label:'Music',   icon:'🎵', color:'#f07a62', searchFn: searchMusic,
    statuses: [
      { id:'completed',   label:'Listened',       color:'#5dd4a6' },
      { id:'in_progress', label:'Listening',       color:'#6a96f0' },
      { id:'want_to',     label:'Want to Listen',  color:'#f5c842' },
      { id:'dropped',     label:'Dropped',         color:'#f07a62' },
    ]},
]

function getCat(type) { return CATS.find(c => c.type === type) || CATS[0] }
function getStatus(type, id) {
  const cat = getCat(type)
  return cat.statuses.find(s => s.id === id) || { label: id, color: '#f5c842' }
}

// ── Stars ─────────────────────────────────────────────────────────────────
function Stars({ value, onChange, size }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(null)}
          style={{ fontSize:size||20, lineHeight:1, userSelect:'none', display:'inline-block', cursor:onChange?'pointer':'default', transition:'all 0.1s', color:n<=(hover!==null?hover:(value||0))?'#f5c842':'rgba(255,255,255,0.15)', transform:hover===n&&onChange?'scale(1.3)':'scale(1)' }}
        >★</span>
      ))}
    </div>
  )
}

// ── Data hook ─────────────────────────────────────────────────────────────
function useMediaLogs() {
  const { user } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('media_logs').select('*').order('created_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function add(payload) {
    const { data, error } = await supabase.from('media_logs').insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setLogs(prev => [data, ...prev])
    return { data, error }
  }
  async function update(id, payload) {
    const { data, error } = await supabase.from('media_logs').update(payload).eq('id', id).select().single()
    if (!error) setLogs(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }
  async function remove(id) {
    await supabase.from('media_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }
  return { logs, loading, add, update, remove }
}

// ── Log modal ─────────────────────────────────────────────────────────────
function LogModal({ item, existing, onSave, onClose }) {
  const isEdit = !!existing
  const src = existing || item || {}
  const [form, setForm] = useState({
    type:        src.type        || 'movie',
    title:       src.title       || '',
    subtitle:    src.subtitle    || '',
    poster_url:  src.poster_url  || '',
    year:        src.year        || '',
    genre:       src.genre       || '',
    description: src.description || '',
    external_id: src.external_id || '',
    status:      src.status      || 'completed',
    rating:      src.rating      || 0,
    review:      src.review      || '',
    date_logged: src.date_logged || format(new Date(), 'yyyy-MM-dd'),
  })
  const [saving, setSaving] = useState(false)
  const cat = getCat(form.type)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = { background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#fff', fontSize:14, padding:'10px 13px', width:'100%', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:6, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }

  const isMusic = form.type === 'music'

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, rating: form.rating || null })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:20, backdropFilter:'blur(6px)' }}>
      <div style={{ background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.10)', borderRadius:22, padding:24, width:'100%', maxWidth:440, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', gap:14, marginBottom:22 }}>
          {/* Poster — square for music, portrait for others */}
          <div style={{ width: isMusic?80:68, height:isMusic?80:100, borderRadius:isMusic?12:10, overflow:'hidden', flexShrink:0, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>
            {form.poster_url
              ? <img src={form.poster_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
              : cat.icon
            }
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{isEdit ? 'Edit Entry' : 'Log Entry'}</div>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontSize:22, cursor:'pointer', lineHeight:1, padding:0 }}>×</button>
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.85)', marginBottom:2 }}>{form.title||'Untitled'}</div>
            {form.subtitle && <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)' }}>{form.subtitle}</div>}
            {form.year && <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', marginTop:2 }}>{form.year}</div>}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {!item && <div><label style={lbl}>Title</label><input value={form.title} onChange={set('title')} placeholder="Enter title..." style={inp} /></div>}
          <div>
            <label style={lbl}>Status</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {cat.statuses.map(s => (
                <button key={s.id} onClick={() => setForm(f=>({...f,status:s.id}))} style={{ padding:'6px 12px', borderRadius:9, fontFamily:'inherit', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s', border:form.status===s.id?'1px solid '+s.color+'55':'1px solid rgba(255,255,255,0.09)', background:form.status===s.id?s.color+'18':'rgba(255,255,255,0.05)', color:form.status===s.id?s.color:'rgba(255,255,255,0.45)' }}>{s.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Rating</label>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <Stars value={form.rating} onChange={v=>setForm(f=>({...f,rating:v}))} size={26} />
              {form.rating>0 && <span style={{ fontSize:13, color:'#f5c842', fontWeight:700 }}>{['','Awful','Poor','Okay','Good','Amazing'][form.rating]}</span>}
            </div>
          </div>
          <div>
            <label style={lbl}>Review <span style={{ color:'rgba(255,255,255,0.22)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span></label>
            <textarea value={form.review} onChange={set('review')} placeholder="What did you think?" rows={3} style={{ ...inp, resize:'vertical', lineHeight:1.6 }} />
          </div>
          <div><label style={lbl}>Date</label><input type="date" value={form.date_logged} onChange={set('date_logged')} style={{ ...inp, colorScheme:'dark' }} /></div>
          <button onClick={save} disabled={saving||!form.title.trim()} style={{ padding:'13px', background:saving||!form.title.trim()?'rgba(245,200,66,0.35)':'#f5c842', border:'none', borderRadius:12, color:'#1a1400', fontSize:14, fontWeight:800, cursor:saving||!form.title.trim()?'not-allowed':'pointer', fontFamily:'inherit', width:'100%' }}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add to Media'}
          </button>
          {isEdit && <button onClick={()=>{onSave(null,true);onClose()}} style={{ padding:'10px', background:'rgba(232,98,74,0.10)', border:'1px solid rgba(232,98,74,0.22)', borderRadius:12, color:'#f07a62', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', width:'100%' }}>Delete Entry</button>}
        </div>
      </div>
    </div>
  )
}

// ── Search result row ─────────────────────────────────────────────────────
function SearchRow({ item, onSelect }) {
  const isMusic = item.type === 'music'
  return (
    <div onClick={()=>onSelect(item)}
      style={{ display:'flex', gap:11, padding:'9px 11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:11, cursor:'pointer', transition:'all 0.14s' }}
      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.borderColor='rgba(245,200,66,0.30)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}}
    >
      <div style={{ width:isMusic?46:42, height:isMusic?46:62, borderRadius:isMusic?8:6, overflow:'hidden', flexShrink:0, background:'#0e0f16', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'rgba(255,255,255,0.2)' }}>
        {item.poster_url ? <img src={item.poster_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'} /> : getCat(item.type).icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{item.title}</div>
        {item.subtitle && <div style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginBottom:2 }}>{item.subtitle}</div>}
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.30)', display:'flex', gap:8 }}>
          {item.year && <span>{item.year}</span>}
          {item.genre && <span>{item.genre}</span>}
        </div>
      </div>
      <div style={{ flexShrink:0, alignSelf:'center', width:26, height:26, borderRadius:'50%', background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#f5c842' }}>+</div>
    </div>
  )
}

// ── Media card ────────────────────────────────────────────────────────────
function MediaCard({ log, onClick }) {
  const [err, setErr] = useState(false)
  const s = getStatus(log.type, log.status)
  const isMusic = log.type === 'music'
  return (
    <div onClick={onClick} style={{ cursor:'pointer' }}
      onMouseEnter={e=>{const o=e.currentTarget.querySelector('.ov');if(o)o.style.opacity='1'}}
      onMouseLeave={e=>{const o=e.currentTarget.querySelector('.ov');if(o)o.style.opacity='0'}}
    >
      <div style={{ position:'relative', borderRadius:isMusic?10:11, overflow:'hidden', aspectRatio:isMusic?'1/1':'2/3', background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.08)', marginBottom:7 }}>
        {log.poster_url && !err
          ? <img src={log.poster_url} alt={log.title} onError={()=>setErr(true)} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, padding:10, textAlign:'center' }}>
              <div style={{ fontSize:28, opacity:0.3 }}>{getCat(log.type).icon}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', lineHeight:1.4 }}>{log.title}</div>
            </div>
        }
        <div className="ov" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.78)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, opacity:0, transition:'opacity 0.2s', padding:10 }}>
          {log.rating>0 && <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(n=><span key={n} style={{ fontSize:13, color:n<=log.rating?'#f5c842':'rgba(255,255,255,0.2)' }}>★</span>)}</div>}
          {log.review && <div style={{ fontSize:11, color:'rgba(255,255,255,0.82)', textAlign:'center', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>"{log.review}"</div>}
          <div style={{ fontSize:11, color:s.color, fontWeight:700 }}>{s.label}</div>
        </div>
        <div style={{ position:'absolute', top:6, left:6, background:s.color+'22', border:'1px solid '+s.color+'55', borderRadius:6, padding:'2px 6px', fontSize:9, fontWeight:700, color:s.color, backdropFilter:'blur(8px)' }}>{s.label}</div>
        {log.rating>0 && <div style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.75)', border:'1px solid rgba(245,200,66,0.35)', borderRadius:6, padding:'2px 7px', fontSize:11, fontWeight:700, color:'#f5c842', backdropFilter:'blur(8px)' }}>★ {log.rating}</div>}
      </div>
      <div style={{ paddingLeft:2 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:1 }}>{log.title}</div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.subtitle||log.year||''}</div>
      </div>
    </div>
  )
}

// ── Category stats bar ────────────────────────────────────────────────────
function CatStats({ logs, cat }) {
  const catLogs = logs.filter(l => l.type === cat.type)
  const rated   = catLogs.filter(l => l.rating)
  const avg     = rated.length ? (rated.reduce((s,l)=>s+ +l.rating,0)/rated.length).toFixed(1) : '—'
  return (
    <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
      {cat.statuses.map(st => {
        const count = catLogs.filter(l => l.status === st.id).length
        return (
          <div key={st.id} style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:80 }}>
            <div style={{ fontFamily:FM, fontSize:18, fontWeight:600, color:st.color }}>{count}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase', textAlign:'center' }}>{st.label}</div>
          </div>
        )
      })}
      <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:2, minWidth:80 }}>
        <div style={{ fontFamily:FM, fontSize:18, fontWeight:600, color:'#f5c842' }}>{avg !== '—' ? '★ '+avg : '—'}</div>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>Avg Rating</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Media() {
  const { logs, loading, add, update, remove } = useMediaLogs()
  const [activeTab,    setActiveTab]    = useState('movie')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy,       setSortBy]       = useState('recent')
  const [showSearch,   setShowSearch]   = useState(false)
  const [query,        setQuery]        = useState('')
  const [results,      setResults]      = useState([])
  const [searching,    setSearching]    = useState(false)
  const [msg,          setMsg]          = useState('')
  const [selected,     setSelected]     = useState(null)
  const [editing,      setEditing]      = useState(null)
  const timer = useRef(null)

  const cat = getCat(activeTab)

  // Reset filter when tab changes
  useEffect(() => { setFilterStatus('all') }, [activeTab])

  // Search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setMsg(''); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setSearching(true); setMsg(''); setResults([])
      try {
        const arr = await cat.searchFn(query)
        setResults(arr)
        if (arr.length === 0) setMsg('No results for "' + query + '"')
      } catch(e) { setMsg('Search error: ' + e.message) }
      setSearching(false)
    }, 500)
    return () => clearTimeout(timer.current)
  }, [query, activeTab])

  async function handleAdd(form) {
    if (!form) return
    await add({ ...form, rating: form.rating || null })
  }
  async function handleEdit(form, del) {
    if (del) { await remove(editing.id); setEditing(null); return }
    await update(editing.id, { ...form, rating: form.rating || null })
  }

  const filtered = logs
    .filter(l => l.type === activeTab)
    .filter(l => filterStatus === 'all' || l.status === filterStatus)
    .sort((a,b) => {
      if (sortBy==='rating') return (b.rating||0)-(a.rating||0)
      if (sortBy==='title')  return a.title.localeCompare(b.title)
      return new Date(b.created_at)-new Date(a.created_at)
    })

  return (
    <div className="fade-up">
      {selected && <LogModal item={selected} onSave={async f=>{await handleAdd(f);setSelected(null)}} onClose={()=>setSelected(null)} />}
      {editing  && <LogModal existing={editing} onSave={handleEdit} onClose={()=>setEditing(null)} />}

      <SectionHeader title="Media" sub="Movies, TV, books and music" accent="#6a96f0"
        action={
          <button onClick={()=>{setShowSearch(s=>!s);setQuery('');setResults([]);setMsg('')}}
            style={{ background:showSearch?'#f5c842':'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', borderRadius:10, color:showSearch?'#1a1400':'#f5c842', fontSize:13, fontWeight:700, padding:'8px 18px', cursor:'pointer', fontFamily:'inherit', transition:'all 0.18s' }}>
            {showSearch ? '✕ Close' : '+ Add'}
          </button>
        }
      />

      {/* Category tabs */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:14, padding:4, gap:3, marginBottom:20 }}>
        {CATS.map(c => (
          <button key={c.type} onClick={()=>{setActiveTab(c.type);setShowSearch(false);setQuery('');setResults([])}}
            style={{ flex:1, padding:'10px 8px', borderRadius:10, border:'none', fontFamily:'inherit', fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              background: activeTab===c.type ? c.color+'22' : 'transparent',
              color:      activeTab===c.type ? c.color : 'rgba(255,255,255,0.38)',
              boxShadow:  activeTab===c.type ? '0 0 0 1px '+c.color+'40' : 'none',
            }}>
            <span style={{ fontSize:16 }}>{c.icon}</span>
            <span>{c.label}</span>
            <span style={{ fontFamily:FM, fontSize:12, opacity:0.7 }}>{logs.filter(l=>l.type===c.type).length}</span>
          </button>
        ))}
      </div>

      {/* Search panel — opens in context of active tab */}
      {showSearch && (
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, padding:18, marginBottom:16 }}>
          <div style={{ fontSize:12, color:cat.color, fontWeight:700, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>
            <span>{cat.icon}</span> Searching {cat.label}
          </div>
          <div style={{ position:'relative', marginBottom:10 }}>
            <input value={query} onChange={e=>setQuery(e.target.value)} autoFocus
              placeholder={'Search ' + cat.label.toLowerCase() + '...'}
              style={{ background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:11, color:'#fff', fontSize:14, padding:'11px 14px 11px 40px', width:'100%', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              onFocus={e=>e.target.style.borderColor=cat.color+'80'}
              onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.12)'}
            />
            <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
              {searching
                ? <div style={{ width:15, height:15, border:'2px solid rgba(245,200,66,0.2)', borderTopColor:'#f5c842', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              }
            </div>
          </div>
          {msg && <div style={{ padding:'9px 13px', background:'rgba(106,150,240,0.09)', border:'1px solid rgba(106,150,240,0.22)', borderRadius:10, fontSize:12, color:'#6a96f0', marginBottom:10 }}>{msg}</div>}
          {results.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:7, maxHeight:380, overflowY:'auto' }}>
              {results.map((item,i) => <SearchRow key={i} item={item} onSelect={it=>setSelected(it)} />)}
            </div>
          )}
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.30)' }}>Can't find it?</span>
            <button onClick={()=>setSelected({type:activeTab,title:query||'',poster_url:'',year:'',subtitle:'',genre:'',description:'',external_id:''})}
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, color:'rgba(255,255,255,0.60)', fontSize:12, fontWeight:700, padding:'5px 12px', cursor:'pointer', fontFamily:'inherit' }}>
              Add manually
            </button>
          </div>
        </div>
      )}

      {/* Per-category stats */}
      <CatStats logs={logs} cat={cat} />

      {/* Sub-filters + sort */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {[{id:'all',label:'All',color:'rgba(255,255,255,0.55)'},...cat.statuses].map(s => (
            <button key={s.id} onClick={()=>setFilterStatus(s.id)} style={{ padding:'5px 11px', borderRadius:8, fontFamily:'inherit', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:filterStatus===s.id?'1px solid '+s.color+'55':'1px solid rgba(255,255,255,0.08)', background:filterStatus===s.id?s.color+'15':'rgba(255,255,255,0.04)', color:filterStatus===s.id?s.color:'rgba(255,255,255,0.40)' }}>{s.label}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:5 }}>
          {[['recent','Recent'],['rating','Rating'],['title','Title']].map(([v,l]) => (
            <button key={v} onClick={()=>setSortBy(v)} style={{ padding:'5px 10px', borderRadius:8, fontFamily:'inherit', fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:'1px solid '+(sortBy===v?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.07)'), background:sortBy===v?'rgba(255,255,255,0.09)':'rgba(255,255,255,0.04)', color:sortBy===v?'rgba(255,255,255,0.80)':'rgba(255,255,255,0.35)' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Poster grid */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={30} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:46, marginBottom:12, opacity:0.35 }}>{cat.icon}</div>
          <div style={{ fontSize:15, fontWeight:600, color:'rgba(255,255,255,0.40)', marginBottom:8 }}>
            {logs.filter(l=>l.type===activeTab).length===0 ? 'No '+cat.label.toLowerCase()+' yet' : 'Nothing matches this filter'}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.25)', marginBottom:20 }}>
            {logs.filter(l=>l.type===activeTab).length===0 ? 'Click + Add to search for '+cat.label.toLowerCase() : 'Try a different filter'}
          </div>
          {logs.filter(l=>l.type===activeTab).length===0 && (
            <button onClick={()=>setShowSearch(true)} style={{ background:'#f5c842', border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:700, padding:'10px 22px', cursor:'pointer', fontFamily:'inherit' }}>+ Add {cat.label}</button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: activeTab==='music' ? 'repeat(auto-fill,minmax(140px,1fr))' : 'repeat(auto-fill,minmax(130px,1fr))', gap:14 }}>
          {filtered.map(log => <MediaCard key={log.id} log={log} onClick={()=>setEditing(log)} />)}
        </div>
      )}
    </div>
  )
}
