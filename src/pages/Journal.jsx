import { useState } from 'react'
import { format } from 'date-fns'
import { useJournal } from '@/hooks/useData'
import { Card, CardTitle, Grid, Button, EmptyState, SectionHeader, StatCard, Tag } from '@/components/shared/UI'

const MOODS = [
  { emoji: '😤', label: 'Stressed', score: 1 },
  { emoji: '😔', label: 'Sad',      score: 2 },
  { emoji: '😐', label: 'Neutral',  score: 3 },
  { emoji: '🙂', label: 'Good',     score: 4 },
  { emoji: '🌟', label: 'Great',    score: 5 },
]
const ALL_TAGS = ['reflection','goals','work','health','mindset','growth','gratitude','challenge','win','rest']

export default function Journal() {
  const { entries, add, remove, streak } = useJournal()
  const [saving, setSaving] = useState(false)
  const [mood, setMood] = useState(null)
  const [tags, setTags] = useState([])
  const [form, setForm] = useState({ gratitude: '', intentions: '', body: '' })
  const [expanded, setExpanded] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const toggleTag = t => setTags(ts => ts.includes(t) ? ts.filter(x => x !== t) : [...ts, t])

  function handleSave() {
    if (!form.gratitude && !form.intentions && !form.body) return
    setSaving(true)
    add({ mood: mood?.emoji, mood_score: mood?.score, tags, ...form })
    setForm({ gratitude: '', intentions: '', body: '' })
    setMood(null); setTags([])
    setSaving(false)
  }

  return (
    <div className="fade-up">
      <SectionHeader title="Journal" sub="Reflect, plan & grow" />

      <Grid cols={3} style={{ marginBottom: 16 }}>
        <StatCard label="Total Entries" value={entries.length} color="var(--text2)" />
        <StatCard label="Streak"        value={`${streak} 🔥`} color="var(--gold2)" sub="days in a row" />
        <StatCard label="Today"         value={format(new Date(), 'MMM d')} color="var(--blue2)" />
      </Grid>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle>New Entry — {format(new Date(), 'EEEE, MMMM d')}</CardTitle>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {MOODS.map(m => (
            <button key={m.label} onClick={() => setMood(mood?.label === m.label ? null : m)} style={{
              flex: 1, padding: '10px 4px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              border: `1px solid ${mood?.label === m.label ? 'var(--gold)' : 'var(--border)'}`,
              background: mood?.label === m.label ? 'rgba(201,153,58,0.1)' : 'var(--bg3)',
            }}>
              <div style={{ fontSize: 22 }}>{m.emoji}</div>
              <div style={{ fontSize: 10, color: mood?.label === m.label ? 'var(--gold2)' : 'var(--text3)', marginTop: 3 }}>{m.label}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>🙏 Gratitude — 3 things I'm grateful for</div>
            <textarea value={form.gratitude} onChange={set('gratitude')} placeholder="1. I'm grateful for..." style={{ minHeight: 72 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>🎯 Intentions — what I want to accomplish today</div>
            <textarea value={form.intentions} onChange={set('intentions')} placeholder="Today I intend to..." style={{ minHeight: 60 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>✍ Free write</div>
            <textarea value={form.body} onChange={set('body')} placeholder="Write freely here..." style={{ minHeight: 110 }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>{ALL_TAGS.map(t => <Tag key={t} selected={tags.includes(t)} onClick={() => toggleTag(t)}>{t}</Tag>)}</div>
          </div>
          <Button variant="gold" fullWidth onClick={handleSave} loading={saving}>Save Entry</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Past Entries</CardTitle>
        {entries.length === 0
          ? <EmptyState icon="📓" message="Write your first journal entry above." />
          : entries.map(e => (
            <div key={e.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                {e.mood && <span style={{ fontSize: 20 }}>{e.mood}</span>}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{format(new Date(e.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{[e.gratitude, e.intentions, e.body].find(Boolean)?.slice(0, 60) || 'No content'}…</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {e.tags?.slice(0, 2).map(t => <Tag key={t} selected>{t}</Tag>)}
                  <span style={{ color: 'var(--text3)', fontSize: 12 }}>{expanded === e.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expanded === e.id && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                  {e.gratitude && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Gratitude</div><div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{e.gratitude}</div></div>}
                  {e.intentions && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Intentions</div><div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{e.intentions}</div></div>}
                  {e.body && <div style={{ marginTop: 12 }}><div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>Journal</div><div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{e.body}</div></div>}
                  {e.tags?.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 12 }}>{e.tags.map(t => <Tag key={t} selected>{t}</Tag>)}</div>}
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}><Button size="sm" variant="danger" onClick={() => remove(e.id)}>Delete</Button></div>
                </div>
              )}
            </div>
          ))
        }
      </Card>
    </div>
  )
}
