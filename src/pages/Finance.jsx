import { useState } from 'react'
import { useTransactions, useProfile } from '@/hooks/useData'
import { Card, CardTitle, StatCard, Grid, Button, ListItem, EmptyState, SectionHeader } from '@/components/shared/UI'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const CATS = ['Food','Rent','Transport','Health','Entertainment','Salary','Investment','Subscriptions','Loans','Other']
const CAT_COLORS = { Food:'#d9644a',Rent:'#8a6ed8',Transport:'#4a7be0',Health:'#3db88a',Entertainment:'#c9993a',Salary:'#3db88a',Investment:'#4a7be0',Subscriptions:'#d45499',Loans:'#e8a030',Other:'#52504d' }
const fmt = n => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const typeColor = t => t === 'income' ? 'var(--teal2)' : t === 'savings' ? 'var(--gold2)' : 'var(--coral2)'

export default function Finance() {
  const { transactions, add, remove, income, expenses, savings, balance, byCategory } = useTransactions()
  const [form, setForm] = useState({ type: 'expense', description: '', amount: '', category: 'Food', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.description || !form.amount) return
    setSaving(true)
    await add({ ...form, amount: parseFloat(form.amount) })
    setForm(f => ({ ...f, description: '', amount: '', notes: '' }))
    setSaving(false)
  }

  const chartData = Object.entries(byCategory).map(([cat, val]) => ({ cat, val: +val.toFixed(2) }))

  return (
    <div className="fade-up">
      <SectionHeader title="Finance" sub="Track income, expenses & savings" />

      <Grid cols={4} style={{ marginBottom: 16 }}>
        <StatCard label="Income"   value={fmt(income)}   color="var(--teal2)" />
        <StatCard label="Expenses" value={fmt(expenses)} color="var(--coral2)" />
        <StatCard label="Savings"  value={fmt(savings)}  color="var(--gold2)" />
        <StatCard label="Balance"  value={fmt(balance)}  color={balance >= 0 ? 'var(--teal2)' : 'var(--coral2)'} />
      </Grid>

      <Grid cols={2} style={{ marginBottom: 16 }}>
        <Card>
          <CardTitle>Add Transaction</CardTitle>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['income','expense','savings'].map(t => (
                <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))} style={{
                  flex: 1, padding: '7px 4px', border: `1px solid ${form.type === t ? typeColor(t) : 'var(--border2)'}`,
                  borderRadius: 'var(--radius-sm)', background: form.type === t ? `${typeColor(t)}18` : 'var(--bg3)',
                  color: form.type === t ? typeColor(t) : 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
                }}>{t}</button>
              ))}
            </div>
            <input value={form.description} onChange={set('description')} placeholder="Description" required />
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" value={form.amount} onChange={set('amount')} placeholder="Amount" min="0" step="0.01" required />
              <select value={form.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Notes (optional)" style={{ minHeight: 50 }} />
            <Button type="submit" variant="gold" loading={saving}>Add Transaction</Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Spending by Category</CardTitle>
          {chartData.length === 0
            ? <EmptyState icon="📊" message="Add expenses to see breakdown" />
            : <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="cat" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12 }} formatter={v => ['$' + v.toFixed(2)]} />
                  <Bar dataKey="val" radius={[4,4,0,0]}>{chartData.map(e => <Cell key={e.cat} fill={CAT_COLORS[e.cat] || '#52504d'} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
          }
        </Card>
      </Grid>

      <Card>
        <CardTitle>All Transactions</CardTitle>
        {transactions.length === 0
          ? <EmptyState icon="💳" message="No transactions yet." />
          : transactions.slice(0, 100).map(t => (
            <ListItem key={t.id}
              icon={t.category[0]}
              iconBg={`${CAT_COLORS[t.category] || '#52504d'}22`}
              name={t.description}
              sub={`${t.category} · ${t.date}`}
              right={<span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: typeColor(t.type) }}>{t.type === 'expense' ? '-' : '+'}{fmt(+t.amount)}</span>}
              onDelete={() => remove(t.id)}
            />
          ))
        }
      </Card>
    </div>
  )
}
