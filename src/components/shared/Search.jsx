import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { format } from 'date-fns'

export default function GlobalSearch({ onClose }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ transactions:[], food:[], journal:[], wellness:[] })
  const [loading, setLoading] = useState(false)
  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults({ transactions:[], food:[], journal:[], wellness:[] }); return }
    const t = setTimeout(() => search(query), 280)
    return () => clearTimeout(t)
  }, [query])

  async function search(q) {
    setLoading(true)
    const like = '%' + q + '%'
    const [tx, fl, je, wg] = await Promise.all([
      supabase.from('transactions').select('id,description,amount,type,date,category').ilike('description', like).limit(5),
      supabase.from('food_logs').select('id,name,calories,date,meal').ilike('name', like).limit(5),
      supabase.from('journal_entries').select('id,body,mood,date').or('body.ilike.' + like + ',gratitude.ilike.' + like).limit(5),
      supabase.from('wellness_goals').select('id,name,icon').ilike('name', like).limit(5),
    ])
    setResults({
      transactions: tx.data || [],
      food:         fl.data || [],
      journal:      je.data || [],
      wellness:     wg.data || [],
    })
    setLoading(false)
  }

  function go(path) { navigate(path); onClose() }

  const total = Object.values(results).flat().length

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:300, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'60px 20px 20px', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background:'rgba(28,30,43,0.97)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:20, width:'100%', maxWidth:560, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>

        {/* Search input */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'16px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.40)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search transactions, food, journal..."
            style={{ flex:1, background:'none', border:'none', color:'#fff', fontSize:16, outline:'none', fontFamily:'inherit' }}
            onKeyDown={e => e.key === 'Escape' && onClose()}
          />
          {loading && <div style={{ width:16, height:16, border:'2px solid rgba(245,200,66,0.2)', borderTopColor:'#f5c842', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />}
          <kbd onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:6, padding:'2px 7px', fontSize:11, color:'rgba(255,255,255,0.45)', cursor:'pointer' }}>Esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight:420, overflowY:'auto' }}>
          {query.length >= 2 && total === 0 && !loading && (
            <div style={{ padding:'32px 20px', textAlign:'center', color:'rgba(255,255,255,0.30)', fontSize:13 }}>No results for "{query}"</div>
          )}

          {results.transactions.length > 0 && (
            <Section title="Finance" icon="💰">
              {results.transactions.map(t => (
                <ResultRow key={t.id} onClick={() => go('/finance')}
                  icon={t.type === 'income' ? '↑' : '↓'}
                  iconColor={t.type === 'income' ? '#5dd4a6' : '#f07a62'}
                  title={t.description}
                  sub={t.category + ' · ' + t.date}
                  right={<span style={{ color: t.type==='income'?'#5dd4a6':'#f07a62', fontFamily:'JetBrains Mono,monospace', fontSize:13 }}>{t.amount}</span>}
                />
              ))}
            </Section>
          )}

          {results.food.length > 0 && (
            <Section title="Nutrition" icon="🍽">
              {results.food.map(f => (
                <ResultRow key={f.id} onClick={() => go('/nutrition')}
                  icon="●" iconColor="#f07a62"
                  title={f.name}
                  sub={f.meal + ' · ' + f.date}
                  right={<span style={{ color:'#f07a62', fontSize:12 }}>{f.calories} kcal</span>}
                />
              ))}
            </Section>
          )}

          {results.journal.length > 0 && (
            <Section title="Journal" icon="✍️">
              {results.journal.map(j => (
                <ResultRow key={j.id} onClick={() => go('/journal')}
                  icon="●" iconColor="#f5c842"
                  title={j.date}
                  sub={(j.body || '').slice(0,80) + '...'}
                />
              ))}
            </Section>
          )}

          {results.wellness.length > 0 && (
            <Section title="Wellness Goals" icon="🎯">
              {results.wellness.map(w => (
                <ResultRow key={w.id} onClick={() => go('/wellness')}
                  icon={w.icon} iconColor="#6a96f0"
                  title={w.name}
                />
              ))}
            </Section>
          )}

          {!query && (
            <div style={{ padding:'20px 18px' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.28)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Quick links</div>
              {[['💰','Finance','/finance'],['🍽','Nutrition','/nutrition'],['🎯','Wellness','/wellness'],['🏋️','Workout','/workout'],['✍️','Journal','/journal']].map(([icon,label,path]) => (
                <ResultRow key={path} onClick={() => go(path)} icon={icon} iconColor="#f5c842" title={label} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ padding:'10px 18px 4px', fontSize:11, color:'rgba(255,255,255,0.32)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>{icon} {title}</div>
      {children}
    </div>
  )
}

function ResultRow({ onClick, icon, iconColor, title, sub, right }) {
  return (
    <div onClick={onClick} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 18px', cursor:'pointer', transition:'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:iconColor, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
        {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub}</div>}
      </div>
      {right}
    </div>
  )
}
