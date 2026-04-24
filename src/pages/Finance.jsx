import { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { SectionHeader, Spinner } from '@/components/shared/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const F  = "'Plus Jakarta Sans',sans-serif"
const FM = "'JetBrains Mono',monospace"

const CATS = ['Food','Rent','Transport','Health','Entertainment','Shopping','Subscriptions','Salary','Investment','Other']
const CAT_COLORS = { Food:'#f07a62', Rent:'#a88ef0', Transport:'#6a96f0', Health:'#5dd4a6', Entertainment:'#f5c842', Shopping:'#ed93b1', Subscriptions:'#f0a262', Salary:'#5dd4a6', Investment:'#6a96f0', Other:'#888780' }
const INTERVALS  = ['daily','weekly','biweekly','monthly','yearly']
const SYMBOLS    = { EUR:'€', USD:'$', JPY:'¥', GBP:'£' }

function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('currency').eq('id', user.id).single()
      .then(({ data }) => setProfile(data))
  }, [user])
  return profile
}

function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*')
      .order('date', { ascending: false }).order('created_at', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Auto-populate recurring transactions for today
  useEffect(() => {
    if (!user || !transactions.length) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const key   = 'folio_recurring_' + today
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    autoPopulate(today)
  }, [transactions.length])

  async function autoPopulate(today) {
    const recurring = transactions.filter(t => t.is_recurring)
    if (!recurring.length) return
    const { data: todayTxs } = await supabase.from('transactions')
      .select('recurring_source_id').eq('user_id', user.id).eq('date', today)
    const already = new Set((todayTxs || []).map(t => t.recurring_source_id).filter(Boolean))
    for (const r of recurring) {
      if (already.has(r.id)) continue
      if (isDue(r, today)) {
        const { data } = await supabase.from('transactions').insert({
          user_id: user.id, description: r.description, amount: r.amount,
          type: r.type, category: r.category, date: today,
          is_recurring: false, recurring_source_id: r.id,
        }).select().single()
        if (data) setTransactions(prev => [data, ...prev])
        await supabase.from('transactions').update({ last_recurring_date: today }).eq('id', r.id)
      }
    }
  }

  function isDue(tx, today) {
    const interval = tx.recurring_interval || 'monthly'
    const last = tx.last_recurring_date || tx.date
    const d1 = new Date(last), d2 = new Date(today)
    const diff = Math.round((d2 - d1) / 86400000)
    if (interval === 'daily')    return diff >= 1
    if (interval === 'weekly')   return diff >= 7
    if (interval === 'biweekly') return diff >= 14
    if (interval === 'monthly')  return d2.getDate() === d1.getDate() && diff >= 28
    if (interval === 'yearly')   return d2.getDate() === d1.getDate() && d2.getMonth() === d1.getMonth() && diff >= 365
    return false
  }

  async function add(payload) {
    const { data, error } = await supabase.from('transactions')
      .insert({ ...payload, user_id: user.id }).select().single()
    if (!error) setTransactions(prev => [data, ...prev])
    return { data, error }
  }

  async function remove(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return { transactions, loading, add, remove }
}

function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState({})

  useEffect(() => {
    if (!user) return
    supabase.from('budgets').select('*').eq('user_id', user.id)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(b => { map[b.category] = b.amount })
        setBudgets(map)
      })
  }, [user])

  async function setBudget(category, amount) {
    const { data } = await supabase.from('budgets').upsert(
      { user_id: user.id, category, amount: parseFloat(amount) },
      { onConflict: 'user_id,category' }
    ).select().single()
    if (data) setBudgets(prev => ({ ...prev, [category]: data.amount }))
  }

  return { budgets, setBudget }
}

// ── CSV Import ────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''))
    const row  = {}
    headers.forEach((h, i) => { row[h] = cols[i] || '' })
    // Try common column names
    return {
      description: row.description || row.name || row.merchant || row.memo || row.details || '',
      amount:      Math.abs(parseFloat(row.amount || row.debit || row.credit || row.value || 0)),
      date:        row.date || row.transaction_date || row.posted_date || format(new Date(), 'yyyy-MM-dd'),
      type:        parseFloat(row.amount || 0) < 0 || row.debit ? 'expense' : 'income',
      category:    row.category || 'Other',
      notes:       row.notes || row.memo || '',
    }
  }).filter(r => r.description && r.amount > 0)
}

export default function Finance() {
  const { user }  = useAuth()
  const profile   = useProfile()
  const { transactions, loading, add, remove } = useTransactions()
  const { budgets, setBudget } = useBudgets()

  const sym = SYMBOLS[profile?.currency] || '€'
  const fmt = n => sym + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })

  const [tab, setTab] = useState('transactions') // transactions | recurring | budgets
  const [form, setForm] = useState({ type:'expense', description:'', amount:'', category:'Food', date:format(new Date(),'yyyy-MM-dd'), notes:'', is_recurring:false, recurring_interval:'monthly' })
  const [saving, setSaving]       = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [csvText, setCsvText]     = useState('')
  const [csvPreview, setCsvPreview] = useState([])
  const [importSaving, setImportSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('all')
  const [budgetEdit, setBudgetEdit] = useState({})
  const [hoveredId, setHoveredId] = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // Monthly window
  const [monthOffset, setMonthOffset] = useState(0)
  const refDate    = monthOffset === 0 ? new Date() : subMonths(new Date(), -monthOffset)
  const monthStart = format(startOfMonth(refDate), 'yyyy-MM-dd')
  const monthEnd   = format(endOfMonth(refDate),   'yyyy-MM-dd')
  const monthLabel = format(refDate, 'MMMM yyyy')

  const monthTxs   = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd)
  const filtered   = filterCat === 'all' ? monthTxs : monthTxs.filter(t => t.category === filterCat)
  const income     = monthTxs.filter(t => t.type==='income').reduce((s,t) => s+(+t.amount),0)
  const expenses   = monthTxs.filter(t => t.type==='expense').reduce((s,t) => s+(+t.amount),0)
  const savings    = monthTxs.filter(t => t.type==='savings').reduce((s,t) => s+(+t.amount),0)
  const balance    = income - expenses - savings
  const byCategory = CATS.reduce((m,c) => { m[c] = monthTxs.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+(+t.amount),0); return m }, {})
  const chartData  = Object.entries(byCategory).filter(([,v]) => v > 0).map(([cat,val]) => ({ cat, val:+val.toFixed(2) }))

  const recurring  = transactions.filter(t => t.is_recurring)

  // Forecast: balance + upcoming recurring this month
  const remainingRecurring = recurring.reduce((s,r) => {
    if (r.type === 'expense') return s + (+r.amount)
    return s
  }, 0)
  const forecast = balance - remainingRecurring

  const typeColor = t => t==='income'?'#5dd4a6':t==='savings'?'#f5c842':'#f07a62'

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    await add({ ...form, amount: parseFloat(form.amount) })
    setForm(f => ({ ...f, description:'', amount:'', notes:'' }))
    setShowAdd(false)
    setSaving(false)
  }

  function handleCSVChange(text) {
    setCsvText(text)
    setCsvPreview(parseCSV(text).slice(0, 10))
  }

  async function handleImport() {
    const rows = parseCSV(csvText)
    if (!rows.length) return
    setImportSaving(true)
    for (const row of rows) {
      await add({ ...row, is_recurring: false })
    }
    setCsvText(''); setCsvPreview([]); setShowImport(false)
    setImportSaving(false)
  }

  async function handleSetBudget(cat) {
    const val = budgetEdit[cat]
    if (!val) return
    await setBudget(cat, val)
    setBudgetEdit(prev => { const n={...prev}; delete n[cat]; return n })
  }

  const inp = { background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#fff', fontSize:13, padding:'9px 12px', outline:'none', fontFamily:F, width:'100%', boxSizing:'border-box' }
  const lbl = { fontSize:11, color:'rgba(255,255,255,0.38)', display:'block', marginBottom:5, fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }

  return (
    <div className="fade-up">
      <SectionHeader title="Finance" sub="Track income, expenses & savings" accent="#f5c842"
        action={
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowImport(s=>!s)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, color:'rgba(255,255,255,0.55)', fontSize:13, fontWeight:700, padding:'8px 14px', cursor:'pointer', fontFamily:F }}>↑ Import CSV</button>
            <button onClick={() => setShowAdd(s=>!s)} style={{ background:showAdd?'#f5c842':'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', borderRadius:10, color:showAdd?'#1a1400':'#f5c842', fontSize:13, fontWeight:700, padding:'8px 18px', cursor:'pointer', fontFamily:F }}>
              {showAdd ? '✕ Close' : '+ Add'}
            </button>
          </div>
        }
      />

      {/* CSV Import panel */}
      {showImport && (
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.70)', marginBottom:10 }}>Import bank CSV</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginBottom:10 }}>Paste your CSV below. Columns auto-detected: date, description, amount, category.</div>
          <textarea value={csvText} onChange={e => handleCSVChange(e.target.value)} placeholder="date,description,amount&#10;2025-01-15,Netflix,-12.99&#10;2025-01-14,Salary,3000" rows={5} style={{ ...inp, resize:'vertical', lineHeight:1.6, marginBottom:10, fontFamily:FM, fontSize:12 }} />
          {csvPreview.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.40)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:7 }}>Preview ({csvPreview.length} of {parseCSV(csvText).length} rows)</div>
              {csvPreview.map((r,i) => (
                <div key={i} style={{ display:'flex', gap:10, fontSize:12, padding:'6px 10px', borderRadius:8, background:'rgba(255,255,255,0.04)', marginBottom:3, alignItems:'center' }}>
                  <span style={{ color:typeColor(r.type), fontFamily:FM, fontWeight:700, minWidth:70 }}>{r.type==='expense'?'-':'+' }{fmt(r.amount)}</span>
                  <span style={{ flex:1, color:'rgba(255,255,255,0.75)' }}>{r.description}</span>
                  <span style={{ color:'rgba(255,255,255,0.35)' }}>{r.date}</span>
                  <span style={{ color:'rgba(255,255,255,0.30)', fontSize:11 }}>{r.category}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleImport} disabled={!csvText.trim() || importSaving} style={{ background:'#f5c842', border:'none', borderRadius:10, color:'#1a1400', fontSize:13, fontWeight:800, padding:'10px 20px', cursor:'pointer', fontFamily:F, opacity:importSaving?0.6:1 }}>
            {importSaving ? 'Importing...' : `Import ${parseCSV(csvText).length} transactions`}
          </button>
        </div>
      )}

      {/* Add transaction panel */}
      {showAdd && (
        <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:16, padding:18, marginBottom:16 }}>
          <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Type selector */}
            <div style={{ display:'flex', gap:6 }}>
              {['income','expense','savings'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f=>({...f,type:t}))} style={{ flex:1, padding:'8px', borderRadius:9, fontFamily:F, fontSize:13, fontWeight:700, cursor:'pointer', transition:'all 0.15s', border:form.type===t?'1px solid '+typeColor(t)+'55':'1px solid rgba(255,255,255,0.09)', background:form.type===t?typeColor(t)+'18':'rgba(255,255,255,0.04)', color:form.type===t?typeColor(t):'rgba(255,255,255,0.45)', textTransform:'capitalize' }}>{t}</button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label style={lbl}>Description</label><input value={form.description} onChange={set('description')} placeholder="e.g. Netflix" required style={inp} /></div>
              <div><label style={lbl}>Amount</label><input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" min="0" step="0.01" required style={inp} /></div>
              <div>
                <label style={lbl}>Category</label>
                <select value={form.category} onChange={set('category')} style={{ ...inp, cursor:'pointer' }}>
                  {CATS.map(c => <option key={c} style={{ background:'#1c1e2b' }}>{c}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Date</label><input type="date" value={form.date} onChange={set('date')} style={{ ...inp, colorScheme:'dark' }} /></div>
            </div>
            {/* Recurring toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'rgba(255,255,255,0.65)' }}>
                <input type="checkbox" checked={form.is_recurring} onChange={e=>setForm(f=>({...f,is_recurring:e.target.checked}))} style={{ width:15, height:15, accentColor:'#f5c842', cursor:'pointer' }} />
                🔁 Recurring
              </label>
              {form.is_recurring && (
                <select value={form.recurring_interval} onChange={set('recurring_interval')} style={{ ...inp, width:'auto', flex:1 }}>
                  {INTERVALS.map(i => <option key={i} value={i} style={{ background:'#1c1e2b', textTransform:'capitalize' }}>{i.charAt(0).toUpperCase()+i.slice(1)}</option>)}
                </select>
              )}
            </div>
            <button type="submit" disabled={saving} style={{ background:'#f5c842', border:'none', borderRadius:11, color:'#1a1400', fontSize:14, fontWeight:800, padding:'12px', cursor:'pointer', fontFamily:F, opacity:saving?0.6:1 }}>
              {saving ? 'Saving...' : 'Add Transaction'}
            </button>
          </form>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
        {[
          { label:'Income',   value:fmt(income),   color:'#5dd4a6' },
          { label:'Expenses', value:fmt(expenses), color:'#f07a62' },
          { label:'Savings',  value:fmt(savings),  color:'#f5c842' },
          { label:'Balance',  value:fmt(balance),  color:balance>=0?'#5dd4a6':'#f07a62' },
          { label:'Forecast', value:fmt(forecast), color:forecast>=0?'#6a96f0':'#f07a62', sub:'end of month' },
        ].map(s => (
          <div key={s.label} style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:FM, fontSize:16, fontWeight:500, color:s.color, marginBottom:3 }}>{s.value}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:700, letterSpacing:'0.05em', textTransform:'uppercase' }}>{s.label}</div>
            {s.sub && <div style={{ fontSize:9, color:'rgba(255,255,255,0.22)', marginTop:1 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Month nav + tabs */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => setMonthOffset(o => o-1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 13px', cursor:'pointer', fontFamily:F }}>← Prev</button>
          <span style={{ fontSize:14, fontWeight:700, color: monthOffset===0?'#f5c842':'#fff', minWidth:120, textAlign:'center' }}>{monthLabel}</span>
          <button onClick={() => setMonthOffset(o => Math.min(o+1, 0))} disabled={monthOffset===0} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:monthOffset===0?'rgba(255,255,255,0.20)':'rgba(255,255,255,0.55)', fontSize:13, padding:'6px 13px', cursor:monthOffset===0?'not-allowed':'pointer', fontFamily:F, opacity:monthOffset===0?0.4:1 }}>Next →</button>
        </div>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:10, padding:3, gap:2 }}>
          {[['transactions','Transactions'],['recurring','Recurring'],['budgets','Budgets']].map(([v,l]) => (
            <button key={v} onClick={() => setTab(v)} style={{ padding:'6px 14px', borderRadius:8, border:'none', fontFamily:F, background:tab===v?'#f5c842':'transparent', color:tab===v?'#1a1400':'rgba(255,255,255,0.45)', fontSize:12, fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            {/* Chart */}
            <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Spending by Category</div>
              {chartData.length === 0
                ? <div style={{ textAlign:'center', padding:30, fontSize:13, color:'rgba(255,255,255,0.25)' }}>No expenses this month</div>
                : <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} margin={{ top:0, right:0, left:-22, bottom:0 }}>
                      <XAxis dataKey="cat" tick={{ fill:'rgba(255,255,255,0.30)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.30)', fontSize:10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background:'#1c1e2b', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, color:'#fff', fontSize:12 }} formatter={v => [sym+v.toFixed(2)]} />
                      <Bar dataKey="val" radius={[5,5,0,0]}>{chartData.map(e => <Cell key={e.cat} fill={CAT_COLORS[e.cat]||'#888780'} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
              }
            </div>
            {/* Category filter */}
            <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Filter by Category</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['all',...CATS].map(c => (
                  <button key={c} onClick={() => setFilterCat(c)} style={{ padding:'5px 10px', borderRadius:8, fontFamily:F, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:filterCat===c?'1px solid '+(CAT_COLORS[c]||'#f5c842')+'55':'1px solid rgba(255,255,255,0.08)', background:filterCat===c?(CAT_COLORS[c]||'#f5c842')+'18':'rgba(255,255,255,0.04)', color:filterCat===c?(CAT_COLORS[c]||'#f5c842'):'rgba(255,255,255,0.45)' }}>
                    {c==='all'?'All':c}
                    {c!=='all' && byCategory[c]>0 && <span style={{ marginLeft:4, fontFamily:FM, fontSize:10 }}>{sym}{byCategory[c].toFixed(0)}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction list */}
          <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>{filtered.length} Transactions</div>
            {loading ? <div style={{ display:'flex', justifyContent:'center', padding:30 }}><Spinner size={22} /></div>
            : filtered.length === 0 ? <div style={{ textAlign:'center', padding:30, fontSize:13, color:'rgba(255,255,255,0.25)' }}>No transactions{filterCat!=='all'?' in '+filterCat:''} this month</div>
            : filtered.map(t => (
              <div key={t.id} onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 10px', borderRadius:10, marginBottom:3, background:hoveredId===t.id?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.03)', border:'1px solid '+(hoveredId===t.id?'rgba(255,255,255,0.09)':'transparent'), transition:'all 0.15s' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:(CAT_COLORS[t.category]||'#888780')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, color:CAT_COLORS[t.category]||'#888780' }}>
                  {t.category[0]}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.description}
                    {t.recurring_source_id && <span style={{ fontSize:9, color:'rgba(255,255,255,0.28)', marginLeft:6 }}>🔁 auto</span>}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{t.category} · {t.date}</div>
                </div>
                <div style={{ fontFamily:FM, fontSize:14, fontWeight:600, color:typeColor(t.type), flexShrink:0 }}>
                  {t.type==='expense'?'-':'+'}{fmt(t.amount)}
                </div>
                {hoveredId===t.id && (
                  <button onClick={() => remove(t.id)} style={{ background:'rgba(240,122,98,0.10)', border:'1px solid rgba(240,122,98,0.22)', borderRadius:7, color:'#f07a62', fontSize:11, padding:'3px 7px', cursor:'pointer', flexShrink:0 }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Recurring tab */}
      {tab === 'recurring' && (
        <div style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.40)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12 }}>Recurring Transactions</div>
          {recurring.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <div style={{ fontSize:36, marginBottom:10, opacity:0.3 }}>🔁</div>
              <div style={{ fontSize:14, color:'rgba(255,255,255,0.35)', marginBottom:8 }}>No recurring transactions yet</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.25)' }}>Add one with the 🔁 Recurring toggle when adding a transaction</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {recurring.map(t => (
                <div key={t.id} onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 12px', borderRadius:11, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.15s' }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:(CAT_COLORS[t.category]||'#888780')+'22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>🔁</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.85)' }}>{t.description}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginTop:1 }}>{t.category} · {t.recurring_interval || 'monthly'}</div>
                  </div>
                  <div style={{ fontFamily:FM, fontSize:14, fontWeight:600, color:typeColor(t.type), flexShrink:0 }}>
                    {t.type==='expense'?'-':'+'}{fmt(t.amount)}
                  </div>
                  {hoveredId===t.id && <button onClick={() => remove(t.id)} style={{ background:'rgba(240,122,98,0.10)', border:'1px solid rgba(240,122,98,0.22)', borderRadius:7, color:'#f07a62', fontSize:11, padding:'3px 7px', cursor:'pointer' }}>✕</button>}
                </div>
              ))}
              <div style={{ marginTop:10, padding:'10px 12px', borderRadius:10, background:'rgba(245,200,66,0.08)', border:'1px solid rgba(245,200,66,0.18)', fontSize:12, color:'rgba(255,255,255,0.55)' }}>
                Monthly recurring expenses: <span style={{ color:'#f07a62', fontWeight:700, fontFamily:FM }}>{fmt(recurring.filter(r=>r.type==='expense').reduce((s,r)=>s+(+r.amount),0))}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budgets tab */}
      {tab === 'budgets' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.38)', marginBottom:4 }}>Set monthly spending limits per category. A progress bar turns red when you're close.</div>
          {CATS.filter(c => c !== 'Salary' && c !== 'Investment').map(cat => {
            const spent  = byCategory[cat] || 0
            const budget = budgets[cat]
            const pct    = budget ? Math.min(spent / budget * 100, 100) : 0
            const over   = budget && spent > budget
            const warn   = budget && pct > 80
            return (
              <div key={cat} style={{ background:'rgba(255,255,255,0.042)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:budget?8:0 }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:CAT_COLORS[cat]||'#888780', flexShrink:0 }} />
                  <span style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.80)', flex:1 }}>{cat}</span>
                  <span style={{ fontFamily:FM, fontSize:13, color:over?'#f07a62':'rgba(255,255,255,0.55)' }}>{fmt(spent)}</span>
                  {budget && <span style={{ fontSize:11, color:'rgba(255,255,255,0.28)' }}>/ {fmt(budget)}</span>}
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <input type="number" value={budgetEdit[cat]??''} onChange={e => setBudgetEdit(prev=>({...prev,[cat]:e.target.value}))} placeholder={budget?fmt(budget).replace(sym,''):'Set budget'} style={{ width:90, background:'#0e0f16', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'#fff', fontSize:12, padding:'5px 9px', outline:'none', fontFamily:F }} />
                    <button onClick={() => handleSetBudget(cat)} style={{ background:'rgba(245,200,66,0.14)', border:'1px solid rgba(245,200,66,0.28)', borderRadius:8, color:'#f5c842', fontSize:11, fontWeight:700, padding:'5px 10px', cursor:'pointer', fontFamily:F }}>Set</button>
                  </div>
                </div>
                {budget > 0 && (
                  <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:4, overflow:'hidden' }}>
                    <div style={{ width:pct+'%', height:'100%', background:over?'#f07a62':warn?'#f5c842':CAT_COLORS[cat]||'#5dd4a6', borderRadius:99, transition:'width 0.5s ease' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
