import { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useTransactions, useProfile } from '@/hooks/useData'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'
import { Card, CardTitle, StatCard, Grid, Button, ListItem, EmptyState, SectionHeader } from '@/components/shared/UI'
import { useToast } from '@/components/shared/Toast'

const SYMBOLS   = { EUR:'€', USD:'$', JPY:'¥' }
const CATS      = ['Food','Transport','Rent','Entertainment','Investment','Health','Shopping','Other']
const CAT_COLORS = { Food:'#f07a62', Transport:'#6a96f0', Rent:'#f5c842', Entertainment:'#a88ef0', Investment:'#5dd4a6', Health:'#ed93b1', Shopping:'#f0b06a', Other:'rgba(255,255,255,0.40)' }

export default function Finance() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { transactions, add, remove, income, expenses, savings, balance, byCategory } = useTransactions()
  const [form, setForm] = useState({ description:'', amount:'', type:'expense', category:'Food', notes:'' })
  const [saving, setSaving] = useState(false)
  const [budgets, setBudgets] = useState({})
  const toast = useToast()

  const sym = SYMBOLS[profile?.currency] || '€'
  const fmt = n => sym + Math.abs(+n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    await add({ ...form, amount: +form.amount })
    setForm(f => ({ ...f, description:'', amount:'', notes:'' }))
    toast.add({ message: form.type + ' logged!', type: 'success' })
    setSaving(false)
  }

  async function handleRemove(id, description) {
    const backup = transactions.find(t => t.id === id)
    await remove(id)
    toast.add({
      message: '"' + description + '" deleted',
      type: 'warning',
      undo: async () => {
        await add({ description: backup.description, amount: backup.amount, type: backup.type, category: backup.category, notes: backup.notes })
      }
    })
  }

  // Weekly spending per day for chart
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const day = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
    const label = format(subDays(new Date(), 6 - i), 'EEE')
    const amt = transactions.filter(t => t.date === day && t.type === 'expense').reduce((s, t) => s + +t.amount, 0)
    return { label, amt }
  })
  const maxWeek = Math.max(...weekData.map(d => d.amt), 1)

  return (
    <div className="fade-up">
      <SectionHeader title="Finance" sub="Track income, expenses & savings" />

      <Grid cols={4} style={{ marginBottom:14 }}>
        <StatCard label="Balance"  value={fmt(balance)}   color="#f5c842" />
        <StatCard label="Income"   value={fmt(income)}    color="#5dd4a6" />
        <StatCard label="Expenses" value={fmt(expenses)}  color="#f07a62" />
        <StatCard label="Savings"  value={fmt(savings)}   color="#6a96f0" />
      </Grid>

      <Grid cols={2} style={{ marginBottom:14 }}>
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
            <div style={{ display:'flex', gap:8 }}>
              {['expense','income','savings'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f=>({...f,type:t}))} style={{ flex:1, padding:'7px', border:'1px solid ' + (form.type===t?'rgba(245,200,66,0.40)':'rgba(255,255,255,0.09)'), borderRadius:8, background:form.type===t?'rgba(245,200,66,0.13)':'rgba(255,255,255,0.05)', color:form.type===t?'#f5c842':'rgba(255,255,255,0.45)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', textTransform:'capitalize' }}>{t}</button>
              ))}
            </div>
            <Button type="submit" variant="gold" loading={saving}>+ Add</Button>
          </form>
        </Card>

        {/* Spending by category */}
        <Card>
          <CardTitle>By Category</CardTitle>
          {Object.keys(byCategory).length === 0
            ? <EmptyState icon="📊" message="No expenses yet" />
            : Object.entries(byCategory).sort((a,b) => b[1]-a[1]).slice(0,6).map(([cat, amt]) => {
              const pct = Math.min((amt / (expenses||1)) * 100, 100)
              const color = CAT_COLORS[cat] || CAT_COLORS.Other
              return (
                <div key={cat} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:13, color:'rgba(255,255,255,0.65)' }}>{cat}</span>
                    <span style={{ fontSize:12, color, fontWeight:700 }}>{fmt(amt)}</span>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:99, height:6, overflow:'hidden' }}>
                    <div style={{ width:pct+'%', height:'100%', background:color, borderRadius:99, transition:'width 0.5s' }} />
                  </div>
                </div>
              )
            })
          }
        </Card>
      </Grid>

      {/* Weekly bar chart */}
      <Card style={{ marginBottom:14 }}>
        <CardTitle>This Week's Spending</CardTitle>
        <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80, marginBottom:8 }}>
          {weekData.map((d,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', background:i===6?'#f5c842':'rgba(245,200,66,0.30)', borderRadius:'4px 4px 0 0', height:Math.max((d.amt/maxWeek)*70,2)+'px', transition:'height 0.4s' }} />
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.30)', fontWeight:600 }}>{d.label}</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'right', fontSize:12, color:'rgba(255,255,255,0.38)' }}>
          Total this week: <span style={{ color:'#f5c842', fontWeight:700 }}>{fmt(weekData.reduce((s,d)=>s+d.amt,0))}</span>
        </div>
      </Card>

      {/* Transaction history */}
      <Card>
        <CardTitle>Recent Transactions</CardTitle>
        {transactions.length === 0
          ? <EmptyState icon="💰" message="No transactions yet." />
          : transactions.slice(0,20).map(t => (
            <ListItem key={t.id}
              icon={t.type==='income'?'↑':t.type==='savings'?'🏦':'↓'}
              iconBg={t.type==='income'?'rgba(61,184,138,0.18)':t.type==='savings'?'rgba(74,123,224,0.18)':'rgba(232,98,74,0.18)'}
              name={t.description}
              sub={t.category + ' · ' + t.date}
              right={<span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:t.type==='income'?'#5dd4a6':t.type==='savings'?'#6a96f0':'#f07a62', fontWeight:500 }}>{t.type==='income'?'+':'-'}{fmt(t.amount)}</span>}
              onDelete={() => handleRemove(t.id, t.description)}
            />
          ))
        }
      </Card>
    </div>
  )
}
