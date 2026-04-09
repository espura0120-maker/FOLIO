import { useState, useCallback } from 'react'
import { format, subDays, startOfWeek } from 'date-fns'
import * as store from '@/lib/store'

const today = () => format(new Date(), 'yyyy-MM-dd')

// Forces re-render by toggling a counter
function useRefresh() {
  const [, set] = useState(0)
  return useCallback(() => set(n => n + 1), [])
}

// ── Profile ───────────────────────────────────────────────────────────────────
export function useProfile() {
  const refresh = useRefresh()
  const profile = store.getProfile()

  function update(patch) {
    store.updateProfile(patch)
    refresh()
  }

  return { profile, update }
}

// ── Finance ───────────────────────────────────────────────────────────────────
export function useTransactions() {
  const refresh = useRefresh()
  const transactions = store.getTransactions()

  function add(payload) {
    store.addTransaction({ ...payload, date: today() })
    refresh()
  }

  function remove(id) {
    store.deleteTransaction(id)
    refresh()
  }

  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + +t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + +t.amount, 0)
  const savings  = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + +t.amount, 0)
  const balance  = income - expenses + savings

  const byCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + +t.amount; return acc }, {})

  return { transactions, add, remove, income, expenses, savings, balance, byCategory }
}

// ── Nutrition ─────────────────────────────────────────────────────────────────
export function useFoodLogs() {
  const refresh = useRefresh()
  const profile = store.getProfile()
  const logs = store.getFoodLogs()

  function add(payload) {
    store.addFoodLog({ ...payload, date: today() })
    refresh()
  }

  function remove(id) {
    store.deleteFoodLog(id)
    refresh()
  }

  const todayLogs     = logs.filter(f => f.date === today())
  const totalCalories = todayLogs.reduce((s, f) => s + (+f.calories || 0), 0)
  const totalProtein  = todayLogs.reduce((s, f) => s + (+f.protein_g || 0), 0)
  const calGoal       = profile.cal_goal || 2000

  return { logs, todayLogs, add, remove, totalCalories, totalProtein, calGoal }
}

// ── Wellness ──────────────────────────────────────────────────────────────────
export function useWellness() {
  const refresh = useRefresh()
  const goals    = store.getWellnessGoals()
  const checkins = store.getCheckins()

  function addGoal(payload) {
    store.addWellnessGoal(payload)
    refresh()
  }

  function removeGoal(id) {
    store.deleteWellnessGoal(id)
    refresh()
  }

  function toggle(goalId) {
    store.toggleCheckin(goalId, today())
    refresh()
  }

  const isCompleted    = id => checkins.some(c => c.goal_id === id && c.date === today())
  const completedToday = goals.filter(g => isCompleted(g.id)).length

  return { goals, checkins, addGoal, removeGoal, toggle, isCompleted, completedToday }
}

// ── Workouts ──────────────────────────────────────────────────────────────────
export function useWorkouts() {
  const refresh  = useRefresh()
  const sessions = store.getWorkouts()

  function add(payload) {
    store.addWorkout({ ...payload, date: today() })
    refresh()
  }

  function remove(id) {
    store.deleteWorkout(id)
    refresh()
  }

  const weekStart          = format(startOfWeek(new Date()), 'yyyy-MM-dd')
  const sessionsThisWeek   = sessions.filter(s => s.date >= weekStart).length
  const totalVolume        = sessions.reduce((s, w) => s + (+w.total_volume || 0), 0)

  return { sessions, add, remove, sessionsThisWeek, totalVolume }
}

// ── Journal ───────────────────────────────────────────────────────────────────
export function useJournal() {
  const refresh = useRefresh()
  const entries = store.getJournalEntries()

  function add(payload) {
    store.addJournalEntry({ ...payload, date: today() })
    refresh()
  }

  function remove(id) {
    store.deleteJournalEntry(id)
    refresh()
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

  return { entries, add, remove, streak }
}
