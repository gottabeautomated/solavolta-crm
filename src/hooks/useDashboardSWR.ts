import useSWR, { mutate, type SWRConfiguration } from 'swr'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { DashboardTask, LeadPriorityRow, WeekOverviewRow, TodayTask, OverdueTask, WeekOverview, LeadDashboardRow } from '../types/dashboard'

const fetcher = async <T>(key: string, args: any) => {
  const { fn, params } = args as { fn: string; params: Record<string, any> }
  const { data, error } = await supabase.rpc(fn, params)
  if (error) throw error
  return data as T
}

export function useTodayTasks(config?: SWRConfiguration) {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const key = activeTenantId && membershipsLoaded ? ['view', 'v_today_tasks', activeTenantId, user?.id || ''] : null
  const { data, error, isLoading, mutate: revalidate } = useSWR<DashboardTask[]>(
    key,
    async () => {
      const { data, error } = await supabase.from('v_today_tasks').select('*').eq('tenant_id', activeTenantId as string)
      if (error) throw error
      return (data || []) as DashboardTask[]
    },
    { revalidateOnFocus: false, shouldRetryOnError: true, ...config }
  )
  const items: TodayTask[] = (data || []).map(t => ({
    taskId: t.task_id,
    source: t.source,
    leadId: t.lead_id,
    tenantId: t.tenant_id,
    title: t.title,
    dueAt: t.due_at,
    priority: t.priority,
    notes: t.notes,
  }))

  return { items, loading: isLoading, error, revalidate }
}

export function useOverdueTasks(config?: SWRConfiguration) {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const key = activeTenantId && membershipsLoaded ? ['view', 'v_overdue_tasks', activeTenantId, user?.id || ''] : null
  const { data, error, isLoading, mutate: revalidate } = useSWR<DashboardTask[]>(
    key,
    async () => {
      const { data, error } = await supabase.from('v_overdue_tasks').select('*').eq('tenant_id', activeTenantId as string)
      if (error) throw error
      return (data || []) as DashboardTask[]
    },
    { revalidateOnFocus: false, shouldRetryOnError: true, ...config }
  )
  const items: OverdueTask[] = (data || []).map(t => ({
    taskId: t.task_id,
    source: t.source,
    leadId: t.lead_id,
    tenantId: t.tenant_id,
    title: t.title,
    dueAt: t.due_at,
    priority: t.priority,
    notes: t.notes,
  }))
  return { items, loading: isLoading, error, revalidate }
}

export function useWeekOverview(config?: SWRConfiguration) {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const key = activeTenantId && membershipsLoaded ? ['view', 'v_week_overview', activeTenantId, user?.id || ''] : null
  const { data, error, isLoading, mutate: revalidate } = useSWR<WeekOverviewRow[]>(
    key,
    async () => {
      const { data, error } = await supabase.from('v_week_overview').select('*').eq('tenant_id', activeTenantId as string)
      if (error) throw error
      return (data || []) as WeekOverviewRow[]
    },
    { revalidateOnFocus: false, shouldRetryOnError: true, ...config }
  )
  const items: WeekOverview[] = (data || []).map(w => ({
    dayDate: w.day_date,
    efuCount: w.efu_count,
    appointmentCount: w.appointment_count,
  }))
  return { items, loading: isLoading, error, revalidate }
}

export function usePriorities(config?: SWRConfiguration) {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const key = activeTenantId && membershipsLoaded ? ['view', 'v_lead_priorities', activeTenantId, user?.id || ''] : null
  const { data, error, isLoading, mutate: revalidate } = useSWR<LeadPriorityRow[]>(
    key,
    async () => {
      const { data, error } = await supabase.from('v_lead_priorities').select('*').eq('tenant_id', activeTenantId as string)
      if (error) throw error
      return (data || []) as LeadPriorityRow[]
    },
    { revalidateOnFocus: false, shouldRetryOnError: true, ...config }
  )
  const items: LeadDashboardRow[] = (data || []).map(p => ({
    leadId: p.lead_id,
    tenantId: p.tenant_id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    topPriority: p.top_priority,
    nextDue: p.next_due,
  }))
  return { items, loading: isLoading, error, revalidate }
}

// Realtime subscriptions to refresh all dashboard keys
export function useDashboardRealtime() {
  const { activeTenantId } = useAuth()
  useEffect(() => {
    if (!activeTenantId) return
    const channel = supabase
      .channel('dashboard-swr-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enhanced_follow_ups' }, () => {
        mutate((key) => Array.isArray(key) && (key[0]==='view' || key[0]==='rpc'))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        mutate((key) => Array.isArray(key) && (key[0]==='view' || key[0]==='rpc'))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeTenantId])
}


