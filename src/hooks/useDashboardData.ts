import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { DashboardTask, LeadPriorityRow, WeekOverviewRow, TodayTask, OverdueTask, WeekOverview, LeadDashboardRow } from '../types/dashboard'

export function useDashboardData() {
  const { activeTenantId, membershipsLoaded } = useAuth()
  const [today, setToday] = useState<TodayTask[]>([])
  const [overdue, setOverdue] = useState<OverdueTask[]>([])
  const [week, setWeek] = useState<WeekOverview[]>([])
  const [priorities, setPriorities] = useState<LeadDashboardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!membershipsLoaded || !activeTenantId) { return }
    setLoading(true)
    setError(null)
    try {
      const [tRes, oRes, wRes, pRes] = await Promise.all([
        supabase.rpc('rpc_get_today_tasks', { p_tenant_id: activeTenantId, p_limit: 50 }),
        supabase.rpc('rpc_get_overdue_tasks', { p_tenant_id: activeTenantId, p_limit: 50 }),
        supabase.rpc('rpc_get_week_overview', { p_tenant_id: activeTenantId }),
        supabase.rpc('rpc_get_lead_priorities', { p_tenant_id: activeTenantId, p_limit: 50 }),
      ])
      if (tRes.error) throw tRes.error
      if (oRes.error) throw oRes.error
      if (wRes.error) throw wRes.error
      if (pRes.error) throw pRes.error
      // map snake_case → camelCase for app-level types
      const mapTask = (t: DashboardTask): TodayTask => ({
        taskId: t.task_id,
        source: t.source,
        leadId: t.lead_id,
        tenantId: t.tenant_id,
        title: t.title,
        dueAt: t.due_at,
        priority: t.priority,
        notes: t.notes,
      })
      const mapWeek = (w: WeekOverviewRow): WeekOverview => ({
        dayDate: w.day_date,
        efuCount: w.efu_count,
        appointmentCount: w.appointment_count,
      })
      const mapLead = (p: LeadPriorityRow): LeadDashboardRow => ({
        leadId: p.lead_id,
        tenantId: p.tenant_id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        topPriority: p.top_priority,
        nextDue: p.next_due,
      })

      setToday(((tRes.data || []) as DashboardTask[]).map(mapTask))
      setOverdue(((oRes.data || []) as DashboardTask[]).map(mapTask))
      setWeek(((wRes.data || []) as WeekOverviewRow[]).map(mapWeek))
      setPriorities(((pRes.data || []) as LeadPriorityRow[]).map(mapLead))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [activeTenantId, membershipsLoaded])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime updates: subscribe to EFU and appointments changes
  useEffect(() => {
    if (!activeTenantId) return
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enhanced_follow_ups' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeTenantId, fetchAll])

  return { today, overdue, week, priorities, loading, error, refetch: fetchAll }
}


