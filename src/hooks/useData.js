import { useState, useEffect, useCallback } from 'react'
import { format, subDays, startOfWeek } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/AuthContext'

const today = () => format(new Date(), 'yyyy-MM-dd')

// ── Profile ───────────────────────────────────────────────────────────────────
export function useProfile() {
  const { profile, updateProfile } = useAuth()
  return { profile: profile || { full_name: '', cal_goal: 2000, weight_unit: 'lbs', currency: 'USD' }, update: updateProfile }
}

// ── Finance ───────────────────────────────────────────────────────────────────
export function useTransactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function add(payload) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...payload, date: today() })
      .select().single()
    if (!error) setTransactions(prev => [data, ...prev])
  }

  async function remove(id) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0)
  const savings  = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + +t.amount, 0)
  const balance  = income - expenses + savings
  const byCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + +t.amount; return acc }, {})

  return { transactions, loading, add, remove, income, expenses, savings, balance, byCategory }
}

// ── Nutrition ─────────────────────────────────────────────────────────────────
export function useFoodLogs() {
  const { profile } = useProfile()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('food_logs')
      .select('*')
      .gte('date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
      .order('created_at', { ascending: false })
    setLogs(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function add(payload) {
    const { data, error } = await supabase
      .from('food_logs')
      .insert({ ...payload, date: today() })
      .select().single()
    if (!error) setLogs(prev => [data, ...prev])
  }

  async function remove(id) {
    await supabase.from('food_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(f => f.id !== id))
  }

  const todayLogs     = logs.filter(f => f.date === today())
  const totalCalories = todayLogs.reduce((s, f) => s + (+f.calories || 0), 0)
  const totalProtein  = todayLogs.reduce((s, f) => s + (+f.protein_g || 0), 0)
  const calGoal       = profile?.cal_goal || 2000

  return { logs, todayLogs, loading, add, remove, totalCalories, totalProtein, calGoal }
}

// ── Wellness ──────────────────────────────────────────────────────────────────
export function useWellness() {
  const [goals, setGoals]       = useState([])
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const [{ data: g }, { data: c }] = await Promise.all([
      supabase.from('wellness_goals').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('wellness_checkins').select('*').gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
    ])
    setGoals(g || [])
    setCheckins(c || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function addGoal(payload) {
    const { data, error } = await supabase
      .from('wellness_goals')
      .insert({ ...payload, sort_order: goals.length, is_active: true })
      .select().single()
    if (!error) setGoals(prev => [...prev, data])
  }

  async function removeGoal(id) {
    await supabase.from('wellness_goals').update({ is_active: false }).eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function toggle(goalId) {
    const existing = checkins.find(c => c.goal_id === goalId && c.date === today())
    if (existing) {
      await supabase.from('wellness_checkins').delete().eq('id', existing.id)
      setCheckins(prev => prev.filter(c => c.id !== existing.id))
    } else {
      const { data, error } = await supabase
        .from('wellness_checkins')
        .insert({ goal_id: goalId, date: today() })
        .select().single()
      if (!error) setCheckins(prev => [...prev, data])
    }
  }

  const isCompleted    = id => checkins.some(c => c.goal_id === id && c.date === today())
  const completedToday = goals.filter(g => isCompleted(g.id)).length

  return { goals, checkins, loading, addGoal, removeGoal, toggle, isCompleted, completedToday }
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export function useWorkouts() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('workout_sessions')
      .select('*, exercises(*)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)
    setSessions(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function add({ session, exercises }) {
    const { data: s, error } = await supabase
      .from('workout_sessions')
      .insert({ ...session, date: today() })
      .select().single()
    if (error) return
    if (exercises.length > 0) {
      await supabase.from('exercises').insert(
        exercises.map((e, i) => ({ ...e, session_id: s.id, sort_order: i }))
      )
    }
    await fetch()
  }

  async function remove(id) {
    await supabase.from('workout_sessions').delete().eq('id', id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  const weekStart        = format(startOfWeek(new Date()), 'yyyy-MM-dd')
  const sessionsThisWeek = sessions.filter(s => s.date >= weekStart).length
  const totalVolume      = sessions.reduce((s, w) => s + (+w.total_volume || 0), 0)

  return { sessions, loading, add, remove, sessionsThisWeek, totalVolume }
}

// ── Journal ───────────────────────────────────────────────────────────────────
export function useJournal() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('journal_entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function add(payload) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({ ...payload, date: today() })
      .select().single()
    if (!error) setEntries(prev => [data, ...prev])
  }

  async function remove(id) {
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const streak = (() => {
    if (!entries.length) return 0
    let count = 0
    let check = new Date()
    const dates = new Set(entries.map(e => e.date))
    for (let i = 0; i < 365; i++) {
      const key = format(check, 'yyyy-MM-dd')
      if (dates.has(key)) { count++; check = subDays(check, 1) }
      else if (count > 0) break
      else check = subDays(check, 1)
    }
    return count
  })()

  return { entries, loading, add, remove, streak }
}
