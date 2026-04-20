import { useState, useEffect, useCallback, useRef } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Card, CardTitle, Grid, Button, EmptyState, Spinner } from '@/components/shared/UI'

// ── Free APIs — no signup or key needed ──────────────────────────────────
const OL_COVER = 'https://covers.openlibrary.org/b/id/'

const TYPES = [
  { id: 'all',   label: 'All',    icon: '◈' },
  { id: 'movie', label: 'Movies', icon: '🎬' },
  { id: 'tv',    label: 'TV',     icon: '📺' },
  { id: 'book',  label: 'Books',  icon: '📚' },
]

const STATUSES = {
  movie: [
    { id: 'completed',   label: 'Watched',      color: '#5dd4a6' },
    { id: 'want_to',     label: 'Want to Watch', color: '#f5c842' },
    { id: 'in_progress', label: 'Watching',      color: '#6a96f0' },
    { id: 'dropped',     label: 'Dropped',       color: '#f07a62' },
  ],
  tv: [
    { id: 'completed',   label: 'Finished',      color: '#5dd4a6' },
    { id: 'in_progress', label: 'Watching',       color: '#6a96f0' },
    { id: 'want_to',     label: 'Want to Watch',  color: '#f5c842' },
    { id: 'dropped',     label: 'Dropped',        color: '#f07a62' },
  ],
  book: [
    { id: 'completed',   label: 'Read',           color: '#5dd4a6' },
    { id: 'in_progress', label: 'Reading',         color: '#6a96f0' },
    { id: 'want_to',     label: 'Want to Read',    color: '#f5c842' },
    { id: 'dropped',     label: 'Dropped',         color: '#f07a62' },
  ],
}

function statusLabel(type, status) {
  const list = STATUSES[type] || STATUSES.movie
  return list.find(s => s.id === status) || { label: status, color: '#f5c842' }
}

function statusColor(type, status) {
  return statusLabel(type, status).color
}

// ── Star rating ─────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(null)}
          style={{
            fontSize: size,
            cursor: onChange ? 'pointer' : 'default',
            color: n <= (hover !== null ? hover : (value || 0)) ? '#f5c842' : 'rgba(255,255,255,0.15)',
            transition: 'color 0.12s, transform 0.12s',
            transform: hover === n && onChange ? 'scale(1.25)' : 'scale(1)',
            display: 'inline-block',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >★</span>
      ))}
    </div>
  )
}

// ── iTunes movie search (free, no key) ───────────────────────────────────
async function searchMovies(query) {
  const r = await fetch(
    'https://itunes.apple.com/search?term=' + encodeURIComponent(query) +
    '&media=movie&entity=movie&limit=8'
  )
  const d = await r.json()
  return (d.results || []).map(item => ({
    external_id:  String(item.trackId || ''),
    title:        item.trackName || item.collectionName || '',
    subtitle:     item.artistName || '',
    year:         (item.releaseDate || '').slice(0, 4),
    poster_url:   item.artworkUrl100
      ? item.artworkUrl100.replace('100x100bb', '400x600bb')
      : null,
    description:  item.longDescription || item.shortDescription || '',
    genre:        item.primaryGenreName || '',
    type:         'movie',
  }))
}

// ── TVMaze TV search (free, no key) ──────────────────────────────────────
async function searchTV(query) {
  const r = await fetch(
    'https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(query)
  )
  const d = await r.json()
  return (d || []).slice(0, 8).map(item => {
    const show = item.show || item
    return {
      external_id:  String(show.id || ''),
      title:        show.name || '',
      subtitle:     show.network?.name || show.webChannel?.name || '',
      year:         (show.premiered || '').slice(0, 4),
      poster_url:   show.image?.original || show.image?.medium || null,
      description:  show.summary ? show.summary.replace(/<[^>]+>/g, '') : '',
      genre:        (show.genres || []).slice(0, 2).join(', '),
      type:         'tv',
    }
  })
}

// ── Open Library book search ─────────────────────────────────────────────────
async function searchBooks(query) {
  const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=key,title,author_name,first_publish_year,cover_i,subject`)
  const d = await r.json()
  return (d.docs || []).slice(0, 8).map(item => ({
    external_id:  item.key,
    title:        item.title,
    subtitle:     item.author_name ? item.author_name[0] : '',
    year:         String(item.first_publish_year || ''),
    poster_url:   item.cover_i ? `${OL_COVER}${item.cover_i}-M.jpg` : null,
    description:  '',
    genre:        item.subject ? item.subject.slice(0, 3).join(', ') : '',
    type:         'book',
  }))
}

// ── Hook ─────────────────────────────────────────────────────────────────────
function useMediaLogs() {
  const { user } = useAuth()
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('media_logs')
      .select('*')
      .order('date_logged', { ascending: false })
      .order('created_at',  { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function add(payload) {
    const { data, error } = await supabase
      .from('media_logs')
      .insert({ ...payload, user_id: user.id })
      .select().single()
    if (!error) setLogs(prev => [data, ...prev])
    return { data, error }
  }

  async function update(id, payload) {
    const { data, error } = await supabase
      .from('media_logs')
      .update(payload)
      .eq('id', id)
      .select().single()
    if (!error) setLogs(prev => prev.map(l => l.id === id ? data : l))
    return { data, error }
  }

  async function remove(id) {
    await supabase.from('media_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, loading, add, update, remove }
}

// ── Search result card ───────────────────────────────────────────────────────
function SearchResult({ item, onSelect }) {
  return (
    <div
      onClick={() => onSelect(item)}
      style={{
        display: 'flex', gap: 12, padding: '10px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(245,200,66,0.28)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      {/* Poster */}
      <div style={{ width: 46, height: 68, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1c1e2b', border: '1px solid rgba(255,255,255,0.07)' }}>
        {item.poster_url
          ? <img src={item.poster_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'rgba(255,255,255,0.18)' }}>
              {item.type === 'book' ? '📚' : item.type === 'tv' ? '📺' : '🎬'}
            </div>
        }
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
        {item.subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 3 }}>{item.subtitle}</div>}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 8 }}>
          {item.year && <span>{item.year}</span>}
          {item.genre && <span>{item.genre}</span>}
        </div>
        {item.description && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, alignSelf: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#f5c842' }}>+</div>
      </div>
    </div>
  )
}

// ── Log modal ────────────────────────────────────────────────────────────────
function LogModal({ item, onSave, onClose, existing }) {
  const isEdit = !!existing
  const [form, setForm] = useState({
    type:        existing?.type        || item?.type        || 'movie',
    title:       existing?.title       || item?.title       || '',
    subtitle:    existing?.subtitle    || item?.subtitle    || '',
    poster_url:  existing?.poster_url  || item?.poster_url  || '',
    year:        existing?.year        || item?.year        || '',
    genre:       existing?.genre       || item?.genre       || '',
    description: existing?.description || item?.description || '',
    external_id: existing?.external_id || item?.external_id || '',
    status:      existing?.status      || 'completed',
    rating:      existing?.rating      || 0,
    review:      existing?.review      || '',
    date_logged: existing?.date_logged || format(new Date(), 'yyyy-MM-dd'),
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const statuses = STATUSES[form.type] || STATUSES.movie

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20, backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#1c1e2b', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 22, padding: 24, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.50)', animation: 'scaleIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}>

        {/* Header with poster */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 22 }}>
          <div style={{ width: 72, height: 106, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
            {form.poster_url
              ? <img src={form.poster_url} alt={form.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(255,255,255,0.20)' }}>
                  {form.type === 'book' ? '📚' : form.type === 'tv' ? '📺' : '🎬'}
                </div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{isEdit ? 'Edit Entry' : 'Log Entry'}</div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.38)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.title}</div>
            {form.subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{form.subtitle}</div>}
            {form.year && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>{form.year}</div>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Type */}
          {!item && (
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 7, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Type</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['movie','tv','book'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: form.type === t ? '1px solid rgba(245,200,66,0.40)' : '1px solid rgba(255,255,255,0.09)', background: form.type === t ? 'rgba(245,200,66,0.14)' : 'rgba(255,255,255,0.05)', color: form.type === t ? '#f5c842' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', textTransform: 'capitalize' }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {/* Title (manual entry only) */}
          {!item && (
            <div>
              <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 6, fontWeight: 700 }}>Title</label>
              <input value={form.title} onChange={set('title')} placeholder="Enter title..." />
            </div>
          )}

          {/* Status */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 7, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {statuses.map(s => (
                <button key={s.id} onClick={() => setForm(f => ({ ...f, status: s.id }))} style={{ padding: '6px 12px', borderRadius: 9, border: form.status === s.id ? '1px solid ' + s.color + '55' : '1px solid rgba(255,255,255,0.09)', background: form.status === s.id ? s.color + '18' : 'rgba(255,255,255,0.05)', color: form.status === s.id ? s.color : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{s.label}</button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 8, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Rating</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={28} />
              {form.rating > 0 && (
                <span style={{ fontSize: 13, color: '#f5c842', fontWeight: 700 }}>
                  {['','Awful','Poor','Okay','Good','Amazing'][form.rating]}
                </span>
              )}
            </div>
          </div>

          {/* Review */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Review <span style={{ color: 'rgba(255,255,255,0.20)', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              value={form.review}
              onChange={set('review')}
              placeholder="What did you think? Any favourite moments?"
              rows={3}
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Date */}
          <div>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', display: 'block', marginBottom: 6, fontWeight: 700 }}>Date</label>
            <input type="date" value={form.date_logged} onChange={set('date_logged')} style={{ colorScheme: 'dark' }} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            style={{ padding: '13px', background: '#f5c842', border: 'none', borderRadius: 12, color: '#1a1400', fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', width: '100%', opacity: saving || !form.title.trim() ? 0.55 : 1, transition: 'opacity 0.15s, transform 0.12s' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.transform = 'scale(1.01)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add to Media'}
          </button>

          {isEdit && (
            <button
              onClick={() => { onSave(null, true); onClose() }}
              style={{ padding: '10px', background: 'rgba(232,98,74,0.10)', border: '1px solid rgba(232,98,74,0.22)', borderRadius: 12, color: '#f07a62', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
            >
              Delete Entry
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Media card in grid ────────────────────────────────────────────────────────
function MediaCard({ log, onClick }) {
  const [imgError, setImgError] = useState(false)
  const s = statusLabel(log.type, log.status)

  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', animation: 'fadeUp 0.28s ease both' }}
      onMouseEnter={e => { e.currentTarget.querySelector('.mc-overlay').style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.querySelector('.mc-overlay').style.opacity = '0' }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: log.type === 'book' ? '2/3' : '2/3', background: '#1c1e2b', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8 }}>
        {log.poster_url && !imgError
          ? <img src={log.poster_url} alt={log.title} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>{log.type === 'book' ? '📚' : log.type === 'tv' ? '📺' : '🎬'}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', lineHeight: 1.4 }}>{log.title}</div>
            </div>
        }

        {/* Overlay on hover */}
        <div className="mc-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0, transition: 'opacity 0.2s', padding: 12 }}>
          {log.rating > 0 && (
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(n => (
                <span key={n} style={{ fontSize: 14, color: n <= log.rating ? '#f5c842' : 'rgba(255,255,255,0.20)' }}>★</span>
              ))}
            </div>
          )}
          {log.review && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{log.review}"</div>
          )}
          <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.label}</div>
        </div>

        {/* Status pill */}
        <div style={{ position: 'absolute', top: 7, left: 7 }}>
          <div style={{ background: s.color + '22', border: '1px solid ' + s.color + '55', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: s.color, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            {s.label}
          </div>
        </div>

        {/* Rating badge top-right */}
        {log.rating > 0 && (
          <div style={{ position: 'absolute', top: 7, right: 7, background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(245,200,66,0.35)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#f5c842', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 2 }}>
            ★ {log.rating}
          </div>
        )}
      </div>

      {/* Title below poster */}
      <div style={{ paddingLeft: 2, paddingRight: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{log.title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.subtitle ? log.subtitle : log.year || ''}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Media() {
  const { logs, loading, add, update, remove } = useMediaLogs()
  const [activeType, setActiveType]   = useState('all')
  const [activeStatus, setActiveStatus] = useState('all')
  const [showSearch, setShowSearch]   = useState(false)
  const [searchType, setSearchType]   = useState('movie')
  const [query, setQuery]             = useState('')
  const [results, setResults]         = useState([])
  const [searching, setSearching]     = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [editLog, setEditLog]         = useState(null)
  const [sortBy, setSortBy]           = useState('recent')
  const searchTimer = useRef(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = searchType === 'book'
          ? await searchBooks(query)
          : searchType === 'tv'
            ? await searchTV(query)
            : await searchMovies(query)
        setResults(res)
      } catch { setResults([]) }
      setSearching(false)
    }, 380)
    return () => clearTimeout(searchTimer.current)
  }, [query, searchType])

  async function handleAdd(form) {
    await add({ ...form, rating: form.rating || null })
  }

  async function handleEdit(form, isDelete) {
    if (isDelete) { await remove(editLog.id); return }
    await update(editLog.id, { ...form, rating: form.rating || null })
  }

  // Filter and sort
  const filtered = logs
    .filter(l => activeType === 'all' || l.type === activeType)
    .filter(l => activeStatus === 'all' || l.status === activeStatus)
    .sort((a, b) => {
      if (sortBy === 'recent')  return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'rating')  return (b.rating || 0) - (a.rating || 0)
      if (sortBy === 'title')   return a.title.localeCompare(b.title)
      return 0
    })

  // Stats
  const stats = {
    movies:  logs.filter(l => l.type === 'movie' && l.status === 'completed').length,
    tv:      logs.filter(l => l.type === 'tv'    && l.status === 'completed').length,
    books:   logs.filter(l => l.type === 'book'  && l.status === 'completed').length,
    reading: logs.filter(l => l.status === 'in_progress').length,
    wantTo:  logs.filter(l => l.status === 'want_to').length,
    avgRating: logs.filter(l => l.rating).length
      ? (logs.filter(l => l.rating).reduce((s, l) => s + +l.rating, 0) / logs.filter(l => l.rating).length).toFixed(1)
      : '—',
  }

  return (
    <div className="fade-up">
      {/* Log modal */}
      {(selectedItem || (showSearch && searchType !== 'book' && searchType !== 'movie' && searchType !== 'tv')) && (
        <LogModal item={selectedItem} onSave={handleAdd} onClose={() => { setSelectedItem(null); setShowSearch(false) }} />
      )}
      {selectedItem && (
        <LogModal item={selectedItem} onSave={handleAdd} onClose={() => { setSelectedItem(null) }} />
      )}
      {editLog && (
        <LogModal existing={editLog} onSave={handleEdit} onClose={() => setEditLog(null)} />
      )}

      <SectionHeader
        title="Media"
        sub="Movies, TV shows and books"
        accent="#6a96f0"
        action={
          <button onClick={() => { setShowSearch(s => !s); setQuery(''); setResults([]) }} style={{ background: showSearch ? '#f5c842' : 'rgba(245,200,66,0.14)', border: '1px solid rgba(245,200,66,0.28)', borderRadius: 10, color: showSearch ? '#1a1400' : '#f5c842', fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}>
            {showSearch ? '✕ Close' : '+ Add'}
          </button>
        }
      />

      {/* ── Search panel ── */}
      {showSearch && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '18px', marginBottom: 16, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', animation: 'fadeUp 0.22s ease' }}>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {[['movie','🎬 Movie'],['tv','📺 TV Show'],['book','📚 Book']].map(([t,l]) => (
              <button key={t} onClick={() => { setSearchType(t); setQuery(''); setResults([]) }} style={{ flex: 1, padding: '8px', borderRadius: 9, border: searchType === t ? '1px solid rgba(245,200,66,0.40)' : '1px solid rgba(255,255,255,0.09)', background: searchType === t ? 'rgba(245,200,66,0.14)' : 'rgba(255,255,255,0.04)', color: searchType === t ? '#f5c842' : 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{l}</button>
            ))}
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: results.length ? 12 : 0 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchType === 'book' ? 'Search books by title or author...' : searchType === 'tv' ? 'Search TV shows...' : 'Search movies...'}
              autoFocus
              style={{ paddingLeft: 38 }}
            />
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              {searching
                ? <div style={{ width: 16, height: 16, border: '2px solid rgba(245,200,66,0.2)', borderTopColor: '#f5c842', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              }
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
              {results.map((item, i) => (
                <SearchResult key={i} item={item} onSelect={it => { setSelectedItem(it); }} />
              ))}
            </div>
          )}

          {query.length >= 2 && !searching && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.30)' }}>
              No results for "{query}"
            </div>
          )}

          {/* Manual entry fallback */}
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)' }}>Can't find it?</span>
            <button
              onClick={() => setSelectedItem({ type: searchType, title: query || '', poster_url: '', year: '', subtitle: '', genre: '', description: '', external_id: '' })}
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(255,255,255,0.60)', fontSize: 12, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Enter manually
            </button>
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Movies',    value: stats.movies,    color: '#6a96f0' },
          { label: 'TV Shows',  value: stats.tv,        color: '#a88ef0' },
          { label: 'Books',     value: stats.books,     color: '#5dd4a6' },
          { label: 'In Progress', value: stats.reading, color: '#f07a62' },
          { label: 'Want to',   value: stats.wantTo,    color: '#f5c842' },
          { label: 'Avg Rating', value: stats.avgRating + (stats.avgRating !== '—' ? '★' : ''), color: '#f5c842' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.042)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 10px', textAlign: 'center', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 20, fontWeight: 500, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.30)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Type filter */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, gap: 2 }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setActiveType(t.id)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: activeType === t.id ? '#f5c842' : 'transparent', color: activeType === t.id ? '#1a1400' : 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ id: 'all', label: 'All', color: 'rgba(255,255,255,0.55)' }, ...((STATUSES[activeType] || Object.values(STATUSES).flat().filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i)))].map(s => (
            <button key={s.id} onClick={() => setActiveStatus(s.id)} style={{ padding: '6px 12px', borderRadius: 8, border: activeStatus === s.id ? '1px solid ' + (s.color || '#f5c842') + '55' : '1px solid rgba(255,255,255,0.08)', background: activeStatus === s.id ? (s.color || '#f5c842') + '15' : 'rgba(255,255,255,0.04)', color: activeStatus === s.id ? (s.color || '#f5c842') : 'rgba(255,255,255,0.40)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{s.label}</button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[['recent','Recent'],['rating','Rating'],['title','Title']].map(([v,l]) => (
            <button key={v} onClick={() => setSortBy(v)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid ' + (sortBy === v ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'), background: sortBy === v ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.04)', color: sortBy === v ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={30} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>
            {activeType === 'book' ? '📚' : activeType === 'tv' ? '📺' : activeType === 'movie' ? '🎬' : '◈'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
            {logs.length === 0 ? 'Your media list is empty' : 'No entries match this filter'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.28)', marginBottom: 20 }}>
            {logs.length === 0 ? 'Search for a movie, show or book to get started' : 'Try a different filter'}
          </div>
          {logs.length === 0 && (
            <button onClick={() => setShowSearch(true)} style={{ background: '#f5c842', border: 'none', borderRadius: 10, color: '#1a1400', fontSize: 13, fontWeight: 700, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
              + Add your first entry
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
          {filtered.map(log => (
            <MediaCard key={log.id} log={log} onClick={() => setEditLog(log)} />
          ))}
        </div>
      )}
    </div>
  )
}
