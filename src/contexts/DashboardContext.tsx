import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react'
import { supabase } from '../lib/supabase'
import { useSWRConfig } from 'swr'

type Priority = 'low' | 'medium' | 'high' | 'overdue'

interface ZipRange { from: string; to: string }
interface FilterState {
  showCompleted: boolean
  onlyToday: boolean
  date?: string | null
  source?: 'all' | 'efu' | 'appointment'
  search: string
  sort: 'priority' | 'due' | 'created'
  logic: 'AND' | 'OR'
  zipRanges: ZipRange[]
  roofTypes: string[]
  priorities: Priority[]
  owners: string[]
}

type TaskSource = 'efu' | 'appointment'

interface DashboardState {
  filters: FilterState
  lastAction?: {
    type: 'complete' | 'reschedule' | 'note' | 'priority'
    payload: any
    rollback: () => Promise<void> | void
  }
}

type DashboardAction =
  | { type: 'SET_FILTERS'; payload: Partial<FilterState> }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_LAST_ACTION'; payload?: DashboardState['lastAction'] }

const LOCAL_KEY = 'dashboard_filters_v2'
const SEARCH_HISTORY_KEY = 'dashboard_search_history_v1'

function loadFilters(): FilterState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return { showCompleted: false, onlyToday: false, date: null, source: 'all', search: '', sort: 'priority', logic: 'AND', zipRanges: [], roofTypes: [], priorities: [], owners: [], ...JSON.parse(raw) }
  } catch {}
  return { showCompleted: false, onlyToday: false, date: null, source: 'all', search: '', sort: 'priority', logic: 'AND', zipRanges: [], roofTypes: [], priorities: [], owners: [] }
}

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_FILTERS':
      const next = { ...state.filters, ...action.payload }
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(next)) } catch {}
      return { ...state, filters: next }
    case 'CLEAR_FILTERS':
      const cleared = { ...state.filters, search: '', zipRanges: [], roofTypes: [], priorities: [], owners: [], date: null, onlyToday: false, source: 'all' }
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cleared)) } catch {}
      return { ...state, filters: cleared }
    case 'SET_LAST_ACTION':
      return { ...state, lastAction: action.payload }
    default:
      return state
  }
}

interface DashboardContextType {
  // state
  filters: FilterState
  setFilters: (patch: Partial<FilterState>) => void
  clearFilters: () => void
  addSearchHistory: (term: string) => void
  getSearchHistory: () => string[]
  // actions
  completeTask: (taskId: string, source?: TaskSource, notes?: string) => Promise<void>
  rescheduleTask: (taskId: string, source: TaskSource | 'efu', newDateISO: string) => Promise<void>
  addQuickNote: (leadId: string, note: string) => Promise<void>
  updateTaskPriority: (taskId: string, priority: Priority) => Promise<void>
  undoLast: () => Promise<void>
  optimisticQueue: React.MutableRefObject<(() => Promise<void>)[]>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({ filters: loadFilters() }))
  const { mutate } = useSWRConfig()
  const optimisticQueue = React.useRef<(() => Promise<void>)[]>([])

  const revalidateAll = useCallback(() => {
    mutate((key) => Array.isArray(key) && (key[0] === 'view' || key[0] === 'rpc'))
  }, [mutate])

  const completeTask = useCallback(async (taskId: string, source: TaskSource = 'efu', notes?: string) => {
    const ts = new Date().toISOString()
    const rollback = async () => {
      if (source === 'efu') {
        await supabase.from('enhanced_follow_ups').update({ completed_at: null }).eq('id', taskId)
      } else {
        await supabase.from('appointments').update({ status: 'scheduled' }).eq('id', taskId)
      }
      await revalidateAll()
    }
    dispatch({ type: 'SET_LAST_ACTION', payload: { type: 'complete', payload: { taskId, source }, rollback } })
    // optimistic: no local list kept; rely on SWR refresh
    if (source === 'efu') {
      await supabase.from('enhanced_follow_ups').update({ completed_at: ts, notes: notes ?? null }).eq('id', taskId)
    } else {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', taskId)
    }
    revalidateAll()
  }, [revalidateAll])

  const rescheduleTask = useCallback(async (taskId: string, source: TaskSource | 'efu', newDateISO: string) => {
    let prev: any = null
    if (source === 'efu') {
      const { data } = await supabase.from('enhanced_follow_ups').select('due_date').eq('id', taskId).single()
      prev = data?.due_date
      const rollback = async () => { await supabase.from('enhanced_follow_ups').update({ due_date: prev }).eq('id', taskId); await revalidateAll() }
      dispatch({ type: 'SET_LAST_ACTION', payload: { type: 'reschedule', payload: { taskId, prev }, rollback } })
      await supabase.from('enhanced_follow_ups').update({ due_date: newDateISO }).eq('id', taskId)
    } else {
      const { data } = await supabase.from('appointments').select('starts_at').eq('id', taskId).single()
      prev = data?.starts_at
      const rollback = async () => { await supabase.from('appointments').update({ starts_at: prev }).eq('id', taskId); await revalidateAll() }
      dispatch({ type: 'SET_LAST_ACTION', payload: { type: 'reschedule', payload: { taskId, prev }, rollback } })
      await supabase.from('appointments').update({ starts_at: newDateISO }).eq('id', taskId)
    }
    revalidateAll()
  }, [revalidateAll])

  const addQuickNote = useCallback(async (leadId: string, note: string) => {
    // Append to lead.documentation for simplicity
    const { data } = await supabase.from('leads').select('documentation').eq('id', leadId).single()
    const prev = data?.documentation || ''
    const stamped = `${new Date().toLocaleString('de-DE')}: ${note}`
    const rollback = async () => { await supabase.from('leads').update({ documentation: prev }).eq('id', leadId); await revalidateAll() }
    dispatch({ type: 'SET_LAST_ACTION', payload: { type: 'note', payload: { leadId }, rollback } })
    await supabase.from('leads').update({ documentation: prev ? `${prev}\n${stamped}` : stamped }).eq('id', leadId)
    revalidateAll()
  }, [revalidateAll])

  const updateTaskPriority = useCallback(async (taskId: string, priority: Priority) => {
    const { data } = await supabase.from('enhanced_follow_ups').select('priority').eq('id', taskId).single()
    const prev = data?.priority
    const rollback = async () => { await supabase.from('enhanced_follow_ups').update({ priority: prev }).eq('id', taskId); await revalidateAll() }
    dispatch({ type: 'SET_LAST_ACTION', payload: { type: 'priority', payload: { taskId, prev }, rollback } })
    await supabase.from('enhanced_follow_ups').update({ priority }).eq('id', taskId)
    revalidateAll()
  }, [revalidateAll])

  const undoLast = useCallback(async () => {
    if (state.lastAction?.rollback) {
      await state.lastAction.rollback()
      dispatch({ type: 'SET_LAST_ACTION', payload: undefined })
    }
  }, [state.lastAction])

  const ctx: DashboardContextType = useMemo(() => ({
    filters: state.filters,
    setFilters: (p) => dispatch({ type: 'SET_FILTERS', payload: p }),
    clearFilters: () => dispatch({ type: 'CLEAR_FILTERS' }),
    addSearchHistory: (term: string) => {
      const t = term.trim()
      if (!t) return
      try {
        const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
        const arr = raw ? JSON.parse(raw) as string[] : []
        const next = [t, ...arr.filter(x => x !== t)].slice(0, 5)
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next))
      } catch {}
    },
    getSearchHistory: () => {
      try { const raw = localStorage.getItem(SEARCH_HISTORY_KEY); return raw ? JSON.parse(raw) as string[] : [] } catch { return [] }
    },
    completeTask,
    rescheduleTask,
    addQuickNote,
    updateTaskPriority,
    undoLast,
    optimisticQueue,
  }), [state.filters, completeTask, rescheduleTask, addQuickNote, updateTaskPriority, undoLast])

  return <DashboardContext.Provider value={ctx}>{children}</DashboardContext.Provider>
}


