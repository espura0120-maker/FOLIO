import { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useTransactions, useProfile } from '@/hooks/useData'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, StatCard, Grid, Button, ListItem, EmptyState, SectionHeader, ProgressBar } from '@/components/shared/UI'

const SYMBOLS    = { EUR:'€', USD:'$', JPY:'¥' }
const CATS       = ['Food','Transport','Rent','Entertainment','Investment','Health','Shopping','Other']
const CAT_COLORS = { Food:'#f07a62', Transport:'#6a96f0', Rent:'#f5c842', Entertainment:'#a88ef0', Investment:'#5dd4a6', Health:'#ed93b1', Shopping:'#f0b06a', Other:'rgba(255,255,255,0.40)' }

function useBudgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState({})

  const fetch = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('budgets').select('*')
    const map = {}
    ;(data || []).forEach(b => { map[b.category] = b.amount })
    setBudgets(map)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  async function setBudget(category, amount) {
    await supabase.from('budgets').upsert({ user_id: user.id, category, amount, period: 'monthly' }, { onConflict: 'user_id,category' })
    setBudgets(prev => ({ ...prev, [category]: amount }))
  }

  async function removeBudget(category) {
    await supabase.from('budgets').delete().eq('user_id', user.id).eq('category', category)
    setBudgets(prev => { const n = { ...prev }; delete n[category]; return n })
  }

  return { budgets, setBudget, removeBudget }
}

export default function Finance() {
  const { profile }   = useProfile()
  const { transactions, add, remove, income, expenses, savings, balance, byCategory } = useTransactions()
  const { budgets, setBudget, removeBudget } = useBudgets()
  const [form, setForm]         = useState({ description:'', amount:'', type:'expense', category:'Food', notes:'' })
  const [saving, setSaving]     = useState(false)
  const [showBudgets, setShowBudgets] = useState(false)
  const [budgetEdit, setBudgetEdit] = useState({ category:'Food', amount:'' })

  const sym = SYMBOLS[profile?.currency] || '€'
  const fmt = n => sym + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // This month only
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const monthTx = transactions.filter(t => t.date >= monthStart)
  const monthExpenses = monthTx.filter(t => t.type === 'expense').reduce((s,t) => s + +t.amount, 0)
  const monthByCategory = monthTx.filter(t => t.type === 'expense').reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + +t.amount; return acc
  }, {})

  // Budget alerts — categories over 80%
  const alerts = Object.entries(budgets).filter(([cat, limit]) => {
    const spent = monthByCategory[cat] || 0
    return spent / limit >= 0.8
  })

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    await add({ ...form, amount: +form.amount })
    setForm(f => ({ ...f, description:'', amount:'', notes:'' }))
    setSaving(false)
  }

  // Weekly spending per day
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day   = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const label = format(subDays(new Date(), 6 - i), 'EEE')
    const amt   = transactions.filter(t => t.date === day && t.type === 'expense').reduce((s,t) => s + +t.amount, 0)
    return { label, amt }
  })
  const maxWeek = Math.max(...weekData.map(d => d.amt), 1)

  return (
    <div className="fade-up">
      <SectionHeader title="Finance" sub="Track income, expenses & savings" accentColor="#f5c842" />

      {/* Budget alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(([cat, limit]) => {
            const spent = monthByCategory[cat] || 0
            const pct   = Math.round((spent / limit) * 100)
            const over  = pct >= 100
            return (
              <div key={cat} style={{ background: over ? 'rgba(232,98,74,0.12)' : 'rgba(245,200,66,0.10)', border: '1px solid ' + (over ? 'rgba(232,98,74,0.30)' : 'rgba(245,200,66,0.25)'), borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{over ? '🚨' : '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: over ? '#f07a62' : '#f5c842' }}>
                    {over ? 'Over budget' : 'Approaching limit'} · {cat}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>
                    {fmt(spent)} / {fmt(limit)} ({pct}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Grid cols={4} style={{ marginBottom: 14 }}>
        <StatCard label="Balance"  value={fmt(balance)}  color="#f5c842" />
        <StatCard label="Income"   value={fmt(income)}   color="#5dd4a6" />
        <StatCard label="Expenses" value={fmt(expenses)} color="#f07a62" />
        <StatCard label="Savings"  value={fmt(savings)}  color="#6a96f0" />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 14 }}>
        {/* Add transaction */}
        <Card>
          <CardTitle>Add Transaction</CardTitle>
          <form onSubmit={handleAdd} style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <input value={form.description} onChange={set('description')} placeholder="Description" required />
            <div style={{ display:'flex', gap:8 }}>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="Amount" min={0} step="0.01" required />
              <select value={form.type} onChange={set('type')}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="savings">Savings</option>
              </select>
            </div>
            <select value={form.category} onChange={set('category')}>
              {CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display:'flex', gap:6 }}>
              {['expense','income','savings'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f=>({...f,type:t}))} style={{ flex:1, padding:'7px', border:'1px solid '+(form.type===t?'rgba(245,200,66,0.40)':'rgba(255,255,255,0.09)'), borderRadius:8, background:form.type===t?'rgba(245,200,66,0.13)':'rgba(255,255,255,0.05)', color:form.type===t?'#f5c842':'rgba(255,255,255,0.45)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize', transition:'all 0.15s' }}>{t}</button>
              ))}
            </div>
            <Button type="submit" variant="gold" loading={saving}>+ Add</Button>
          </form>
        </Card>

        {/* Category breakdown + budgets */}
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.35)' }}>This Month</div>
            <button onClick={() => setShowBudgets(b => !b)} style={{ background:'rgba(245,200,66,0.12)', border:'1px solid rgba(245,200,66,0.25)', borderRadius:8, color:'#f5c842', fontSize:11, fontWeight:700, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit' }}>
              {showBudgets ? 'Hide' : 'Set Budgets'}
            </button>
          </div>

          {showBudgets ? (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                <select value={budgetEdit.category} onChange={e => setBudgetEdit(b=>({...b,category:e.target.value}))} style={{ flex:1 }}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={budgetEdit.amount} onChange={e => setBudgetEdit(b=>({...b,amount:e.target.value}))} placeholder="Limit" min={0} style={{ width:90 }} />
                <Button size="sm" variant="gold" onClick={() => { if (budgetEdit.amount) { setBudget(budgetEdit.category, +budgetEdit.amount); setBudgetEdit(b=>({...b,amount:''})) } }}>Set</Button>
              </div>
              {Object.entries(budgets).map(([cat, limit]) => (
                <div key={cat} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:13, flex:1, color:'rgba(255,255,255,0.65)' }}>{cat}</span>
                  <span style={{ fontSize:12, color:'#f5c842', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(limit)}</span>
                  <button onClick={() => removeBudget(cat)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.28)', fontSize:16, cursor:'pointer' }}>x</button>
                </div>
              ))}
              {Object.keys(budgets).length === 0 && <div style={{ fontSize:12, color:'rgba(255,255,255,0.30)', textAlign:'center', padding:'12px 0' }}>No budgets set yet</div>}
            </div>
          ) : (
            Object.keys(monthByCategory).length === 0
              ? <EmptyState icon="📊" message="No expenses this month" />
              : Object.entries(monthByCategory).sort((a,b) => b[1]-a[1]).slice(0,6).map(([cat, amt]) => {
                const budget = budgets[cat]
                const color  = CAT_COLORS[cat] || 'rgba(255,255,255,0.40)'
                const pct    = budget ? Math.min((amt / budget) * 100, 100) : Math.min((amt / (monthExpenses||1)) * 100, 100)
                return (
                  <ProgressBar key={cat} label={cat + (budget ? ' (' + fmt(amt) + ' / ' + fmt(budget) + ')' : ' ' + fmt(amt))} value={pct} max={100} color={color} warn={!!budget} />
                )
              })
          )}
        </Card>
      </Grid>

      {/* Weekly bar chart */}
      <Card style={{ marginBottom: 14 }}>
        <CardTitle>This Week's Spending</CardTitle>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
          {weekData.map((d,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', background:i===6?'#f5c842':'rgba(245,200,66,0.28)', borderRadius:'4px 4px 0 0', height:Math.max((d.amt/maxWeek)*70,2)+'px', transition:'height 0.5s ease' }} />
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:'rgba(255,255,255,0.38)' }}>
          Total this week: <span style={{ color:'#f5c842', fontWeight:700 }}>{fmt(weekData.reduce((s,d)=>s+d.amt,0))}</span>
        </div>
      </Card>

      {/* Transactions */}
      <Card>
        <CardTitle>Recent Transactions</CardTitle>
        {transactions.length === 0
          ? <EmptyState icon="💰" message="No transactions yet." />
          : transactions.slice(0,25).map(t => (
            <ListItem key={t.id}
              icon={t.type==='income'?'↑':t.type==='savings'?'🏦':'↓'}
              iconBg={t.type==='income'?'rgba(61,184,138,0.18)':t.type==='savings'?'rgba(74,123,224,0.18)':'rgba(232,98,74,0.18)'}
              name={t.description}
              sub={t.category + ' · ' + t.date}
              right={<span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:t.type==='income'?'#5dd4a6':t.type==='savings'?'#6a96f0':'#f07a62', fontWeight:500 }}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</span>}
              onDelete={() => remove(t.id)}
            />
          ))
        }
      </Card>
    </div>
  )
}
