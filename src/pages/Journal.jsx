import { useState } from 'react'
import { format } from 'date-fns'
import { useJournal } from '@/hooks/useData'
import { SectionHeader, Spinner } from '@/components/shared/UI'

const F  = "'Plus Jakarta Sans',sans-serif"
const FM = "'JetBrains Mono',monospace"

const MOODS = [
  { emoji:'😔', label:'Low',     score:1, color:'#f07a62' },
  { emoji:'😕', label:'Meh',     score:2, color:'#f0a262' },
  { emoji:'😐', label:'Okay',    score:3, color:'#f5c842' },
  { emoji:'🙂', label:'Good',    score:4, color:'#b8e86e' },
  { emoji:'😊', label:'Great',   score:5, color:'#5dd4a6' },
  { emoji:'😄', label:'Amazing', score:6, color:'#6a96f0' },
  { emoji:'🤩', label:'Peak',    score:7, color:'#a88ef0' },
]

const TEMPLATES = [
  {
    id: 'morning',
    label: '🌅 Morning Pages',
    desc: 'Start your day with intention',
    fields: [
      { key:'gratitude',   label:'🙏 Gratitude — 3 things I\'m grateful for', placeholder:'1. I\'m grateful for...\n2.\n3.', rows:4 },
      { key:'intentions',  label:'🎯 Intentions — what I want to accomplish today', placeholder:'Today I intend to...', rows:3 },
      { key:'body',        label:'✍️ Morning thoughts — whatever\'s on your mind', placeholder:'Write freely here...', rows:5 },
    ]
  },
  {
    id: 'evening',
    label: '🌙 Evening Reflection',
    desc: 'Wind down and review your day',
    fields: [
      { key:'body',        label:'📝 How did today go?', placeholder:'Today was...', rows:5 },
      { key:'gratitude',   label:'✨ What went well?', placeholder:'A win from today...', rows:3 },
      { key:'intentions',  label:'🌱 What would I do differently?', placeholder:'Tomorrow I\'ll...', rows:3 },
    ]
  },
  {
    id: 'freestyle',
    label: '✦ Freestyle',
    desc: 'Just write whatever comes to mind',
    fields: [
      { key:'body', label:'✍️ Free write', placeholder:'Write anything...', rows:12 },
    ]
  },
  {
    id: 'gratitude',
    label: '💛 Gratitude Log',
    desc: '5-minute positivity practice',
    fields: [
      { key:'gratitude',  label:'💛 5 things I appreciate right now', placeholder:'1.\n2.\n3.\n4.\n5.', rows:6 },
      { key:'body',       label:'🌟 One person I\'m grateful for and why', placeholder:'I appreciate...', rows:3 },
    ]
  },
]

const ALL_TAGS = ['reflection','goals','work','health','mindset','growth','gratitude','challenge','win','rest','travel','family','creative']

export default function Journal() {
  const { entries, loading, saveEntry, deleteEntry, streak } = useJournal()

  const [template, setTemplate]   = useState(TEMPLATES[0])
  const [mood, setMood]           = useState(null)
  const [tags, setTags]           = useState([])
  const [form, setForm]           = useState({ gratitude:'', intentions:'', body:'' })
  const [expanded, setExpanded]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [filterTag, setFilterTag] = useState(null)
  const [search, setSearch]       = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleTag = t => setTags(ts => ts.includes(t) ? ts.filter(x=>x!==t) : [...ts,t])

  async function handleSave() {
    const hasContent = template.fields.some(f => form[f.key]?.trim())
    if (!hasContent) return
    setSaving(true)
    await saveEntry({ mood: mood?.emoji, mood_score: mood?.score, tags, ...form })
    setForm({ gratitude:'', intentions:'', body:'' })
    setMood(null); setTags([])
    setSaving(false)
  }

  const filtered = entries
    .filter(e => !filterTag || e.tags?.includes(filterTag))
    .filter(e => !search.trim() || [e.gratitude,e.intentions,e.body].join(' ').toLowerCase().includes(search.toLowerCase()))

  const inp = (rows) => ({ background:'#0e0f16', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, color:'rgba(255,255,255,0.85)', fontSize:14, padding:'11px 13px', width:'100%', outline:'none', fontFamily:F, resize:'vertical', lineHeight:1.65, minHeight: rows*24, boxSizing:'border-box' })

  return (
    <div className="fade-up">
      <SectionHeader title="Journal" sub="Your private space to reflect and grow" accent="#6a96f0" />

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Total Entries', value:entries.length,      color:'#6a96f0' },
          { label:'Streak',        value:`${streak} 🔥`,       color:'#f5c842' },
          { label:'Today',         value:format(new Date(),'MMM d'), color:'#5dd4a6' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontFamily:FM, fontSize:20, fontWeight:500, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* New entry */}
      <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:18, padding:20, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.80)' }}>
            New Entry — {format(new Date(), 'EEEE, MMMM d')}
          </div>
          {/* Template picker */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setTemplate(t); setForm({ gratitude:'', intentions:'', body:'' }) }}
                style={{ padding:'5px 11px', borderRadius:8, fontFamily:F, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:template.id===t.id?'1px solid rgba(106,150,240,0.45)':'1px solid rgba(255,255,255,0.09)', background:template.id===t.id?'rgba(106,150,240,0.14)':'rgba(255,255,255,0.04)', color:template.id===t.id?'#6a96f0':'rgba(255,255,255,0.45)' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood picker */}
        <div style={{ display:'flex', gap:5, marginBottom:16, flexWrap:'wrap' }}>
          {MOODS.map(m => (
            <button key={m.label} onClick={() => setMood(mood?.label===m.label ? null : m)}
              style={{ flex:'1 1 0', minWidth:36, padding:'8px 4px', borderRadius:10, border:`1px solid ${mood?.label===m.label?m.color+'55':'rgba(255,255,255,0.08)'}`, background:mood?.label===m.label?m.color+'18':'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
              <div style={{ fontSize:20 }}>{m.emoji}</div>
              <div style={{ fontSize:9, color:mood?.label===m.label?m.color:'rgba(255,255,255,0.30)', marginTop:2, fontWeight:700 }}>{m.label}</div>
            </button>
          ))}
        </div>

        {/* Template fields */}
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:14 }}>
          {template.fields.map(field => (
            <div key={field.key+template.id}>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.40)', marginBottom:6, fontWeight:600 }}>{field.label}</div>
              <textarea value={form[field.key]||''} onChange={set(field.key)} placeholder={field.placeholder} rows={field.rows} style={inp(field.rows)} />
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Tags</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {ALL_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)}
                style={{ padding:'4px 10px', borderRadius:7, fontFamily:F, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:tags.includes(t)?'1px solid rgba(106,150,240,0.45)':'1px solid rgba(255,255,255,0.09)', background:tags.includes(t)?'rgba(106,150,240,0.14)':'rgba(255,255,255,0.04)', color:tags.includes(t)?'#6a96f0':'rgba(255,255,255,0.45)' }}>
                #{t}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} style={{ background:'#6a96f0', border:'none', borderRadius:12, color:'#fff', fontSize:14, fontWeight:800, padding:'13px', cursor:saving?'not-allowed':'pointer', fontFamily:F, width:'100%', opacity:saving?0.6:1 }}>
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
      </div>

      {/* Past entries */}
      <div>
        {/* Search + filter */}
        <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries..."
            style={{ flex:1, minWidth:140, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, color:'#fff', fontSize:13, padding:'8px 13px', outline:'none', fontFamily:F }}
          />
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {ALL_TAGS.filter(t => entries.some(e => e.tags?.includes(t))).map(t => (
              <button key={t} onClick={() => setFilterTag(filterTag===t ? null : t)}
                style={{ padding:'4px 9px', borderRadius:7, fontFamily:F, fontSize:10, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:filterTag===t?'1px solid rgba(106,150,240,0.45)':'1px solid rgba(255,255,255,0.09)', background:filterTag===t?'rgba(106,150,240,0.14)':'rgba(255,255,255,0.04)', color:filterTag===t?'#6a96f0':'rgba(255,255,255,0.38)' }}>
                #{t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={24} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', fontSize:13, color:'rgba(255,255,255,0.30)' }}>
            {entries.length === 0 ? 'Write your first journal entry above.' : 'No entries match your filter.'}
          </div>
        ) : filtered.map(e => {
          const moodObj = MOODS.find(m => m.score === e.mood_score)
          return (
            <div key={e.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, marginBottom:8, overflow:'hidden', transition:'border-color 0.15s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', cursor:'pointer' }} onClick={() => setExpanded(expanded===e.id?null:e.id)}>
                {e.mood && <span style={{ fontSize:20, flexShrink:0 }}>{e.mood}</span>}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.80)', marginBottom:2 }}>
                    {e.date ? format(new Date(e.date+'T12:00:00'), 'EEEE, MMMM d, yyyy') : ''}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {[e.gratitude,e.intentions,e.body].find(Boolean)?.slice(0,70)||'No content'}...
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  {moodObj && <span style={{ fontSize:9, background:moodObj.color+'18', border:'1px solid '+moodObj.color+'35', borderRadius:5, padding:'2px 6px', color:moodObj.color, fontWeight:700 }}>{moodObj.label}</span>}
                  {e.tags?.slice(0,2).map(t => <span key={t} style={{ fontSize:9, background:'rgba(106,150,240,0.12)', border:'1px solid rgba(106,150,240,0.25)', borderRadius:5, padding:'2px 7px', color:'#6a96f0' }}>#{t}</span>)}
                  <span style={{ color:'rgba(255,255,255,0.30)', fontSize:12 }}>{expanded===e.id?'▲':'▼'}</span>
                </div>
              </div>

              {expanded===e.id && (
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { key:'gratitude',  label:'Gratitude' },
                    { key:'intentions', label:'Intentions' },
                    { key:'body',       label:'Journal' },
                  ].map(s => e[s.key] && (
                    <div key={s.key} style={{ marginTop:14 }}>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:700, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:6 }}>{s.label}</div>
                      <div style={{ fontSize:14, lineHeight:1.7, color:'rgba(255,255,255,0.75)', whiteSpace:'pre-wrap' }}>{e[s.key]}</div>
                    </div>
                  ))}
                  {e.tags?.length > 0 && (
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:12 }}>
                      {e.tags.map(t => <span key={t} style={{ fontSize:10, background:'rgba(106,150,240,0.12)', border:'1px solid rgba(106,150,240,0.25)', borderRadius:6, padding:'3px 8px', color:'#6a96f0' }}>#{t}</span>)}
                    </div>
                  )}
                  <div style={{ marginTop:14, display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={() => deleteEntry(e.id)} style={{ background:'rgba(240,122,98,0.10)', border:'1px solid rgba(240,122,98,0.22)', borderRadius:9, color:'#f07a62', fontSize:12, fontWeight:700, padding:'6px 14px', cursor:'pointer', fontFamily:F }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
