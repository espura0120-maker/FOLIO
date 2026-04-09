// All data is stored in localStorage under namespaced keys.
// Structure mirrors what Supabase would store so upgrading later is easy.

const KEY = 'folio_v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

function defaultState() {
  return {
    profile: {
      full_name: '',
      cal_goal: 2000,
      weight_unit: 'lbs',
      currency: 'USD',
    },
    transactions: [],
    food_logs: [],
    wellness_goals: [
      { id: uid(), name: 'Drink 8 glasses of water', icon: '💧', is_active: true, sort_order: 0 },
      { id: uid(), name: 'Walk 10,000 steps',        icon: '🏃', is_active: true, sort_order: 1 },
      { id: uid(), name: 'Meditate 10 minutes',      icon: '🧘', is_active: true, sort_order: 2 },
      { id: uid(), name: 'Sleep 8 hours',            icon: '😴', is_active: true, sort_order: 3 },
      { id: uid(), name: 'Read 20 pages',            icon: '📚', is_active: true, sort_order: 4 },
    ],
    wellness_checkins: [],
    workout_sessions: [],
    journal_entries: [],
  }
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getState() {
  return load() || defaultState()
}

export function setState(updater) {
  const current = getState()
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
  save(next)
  return next
}

// ── Profile ──────────────────────────────────────────────────────────────────
export function getProfile()         { return getState().profile }
export function updateProfile(patch) { return setState(s => ({ ...s, profile: { ...s.profile, ...patch } })).profile }

// ── Transactions ─────────────────────────────────────────────────────────────
export function getTransactions()   { return getState().transactions }
export function addTransaction(t)   { return setState(s => ({ ...s, transactions: [{ ...t, id: uid(), created_at: new Date().toISOString() }, ...s.transactions] })).transactions }
export function deleteTransaction(id) { return setState(s => ({ ...s, transactions: s.transactions.filter(t => t.id !== id) })).transactions }

// ── Food logs ────────────────────────────────────────────────────────────────
export function getFoodLogs()     { return getState().food_logs }
export function addFoodLog(f)     { return setState(s => ({ ...s, food_logs: [{ ...f, id: uid(), created_at: new Date().toISOString() }, ...s.food_logs] })).food_logs }
export function deleteFoodLog(id) { return setState(s => ({ ...s, food_logs: s.food_logs.filter(f => f.id !== id) })).food_logs }

// ── Wellness goals ───────────────────────────────────────────────────────────
export function getWellnessGoals()    { return getState().wellness_goals.filter(g => g.is_active) }
export function addWellnessGoal(g)    { return setState(s => ({ ...s, wellness_goals: [...s.wellness_goals, { ...g, id: uid(), is_active: true, sort_order: s.wellness_goals.length }] })).wellness_goals }
export function deleteWellnessGoal(id){ return setState(s => ({ ...s, wellness_goals: s.wellness_goals.map(g => g.id === id ? { ...g, is_active: false } : g) })).wellness_goals }

// ── Wellness checkins ────────────────────────────────────────────────────────
export function getCheckins()         { return getState().wellness_checkins }
export function toggleCheckin(goal_id, date) {
  const state = getState()
  const existing = state.wellness_checkins.find(c => c.goal_id === goal_id && c.date === date)
  if (existing) {
    return setState(s => ({ ...s, wellness_checkins: s.wellness_checkins.filter(c => !(c.goal_id === goal_id && c.date === date)) })).wellness_checkins
  } else {
    return setState(s => ({ ...s, wellness_checkins: [...s.wellness_checkins, { id: uid(), goal_id, date, created_at: new Date().toISOString() }] })).wellness_checkins
  }
}

// ── Workouts ─────────────────────────────────────────────────────────────────
export function getWorkouts()     { return getState().workout_sessions }
export function addWorkout(w)     { return setState(s => ({ ...s, workout_sessions: [{ ...w, id: uid(), created_at: new Date().toISOString() }, ...s.workout_sessions] })).workout_sessions }
export function deleteWorkout(id) { return setState(s => ({ ...s, workout_sessions: s.workout_sessions.filter(w => w.id !== id) })).workout_sessions }

// ── Journal ──────────────────────────────────────────────────────────────────
export function getJournalEntries()  { return getState().journal_entries }
export function addJournalEntry(e)   { return setState(s => ({ ...s, journal_entries: [{ ...e, id: uid(), created_at: new Date().toISOString() }, ...s.journal_entries] })).journal_entries }
export function deleteJournalEntry(id){ return setState(s => ({ ...s, journal_entries: s.journal_entries.filter(e => e.id !== id) })).journal_entries }

// ── Export / Import ──────────────────────────────────────────────────────────
export function exportData() {
  const data = JSON.stringify(getState(), null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `folio-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    save(data)
    return true
  } catch {
    return false
  }
}
