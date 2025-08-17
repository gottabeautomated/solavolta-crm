import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { EnhancedFollowUp } from '../types/status'

export type RangeFilter = 'overdue' | 'today' | 'next7'

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d: Date) { const x = new Date(d); x.setHours(23,59,59,999); return x }

export function useEnhancedFollowUps() {
  const { activeTenantId, membershipsLoaded } = useAuth()
  const [items, setItems] = useState<EnhancedFollowUp[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!membershipsLoaded || !activeTenantId) { setItems([]); return }
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('enhanced_follow_ups')
        .select('*')
        .eq('tenant_id', activeTenantId as string)
        .order('due_date', { ascending: true })
      if (error) throw error
      setItems((data || []) as EnhancedFollowUp[])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [activeTenantId, membershipsLoaded])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = useCallback(async (payload: Omit<EnhancedFollowUp, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('enhanced_follow_ups')
      .insert([payload])
      .select('*')
      .single()
    if (!error && data) setItems(prev => [...prev, data as EnhancedFollowUp])
    return { data: data as EnhancedFollowUp | null, error }
  }, [])

  const update = useCallback(async (id: string, patch: Partial<EnhancedFollowUp>) => {
    const { data, error } = await supabase
      .from('enhanced_follow_ups')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (!error && data) setItems(prev => prev.map(it => it.id === id ? (data as EnhancedFollowUp) : it))
    return { data: data as EnhancedFollowUp | null, error }
  }, [])

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('enhanced_follow_ups')
      .delete()
      .eq('id', id)
    if (!error) setItems(prev => prev.filter(it => it.id !== id))
    return { error }
  }, [])

  const markCompleted = useCallback(async (id: string) => {
    return update(id, { completed_at: new Date().toISOString() })
  }, [update])

  // Derived lists
  const { overdue, today, next7 } = useMemo(() => {
    const now = new Date()
    const s = startOfDay(now)
    const e = endOfDay(now)
    const in7 = new Date(s); in7.setDate(in7.getDate() + 7)
    const isPending = (it: EnhancedFollowUp) => !it.completed_at
    const o = items.filter(it => isPending(it) && new Date(it.due_date) < s)
    const t = items.filter(it => isPending(it) && new Date(it.due_date) >= s && new Date(it.due_date) <= e)
    const n = items.filter(it => isPending(it) && new Date(it.due_date) > e && new Date(it.due_date) <= in7)
    return { overdue: o, today: t, next7: n }
  }, [items])

  return { items, overdue, today, next7, loading, error, refetch: fetchAll, create, update, remove, markCompleted }
}


