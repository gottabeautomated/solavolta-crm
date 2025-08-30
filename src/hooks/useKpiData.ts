import useSWR, { mutate } from 'swr'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useEffect } from 'react'

async function fromSingle<T>(view: string, tenantId: string): Promise<T | null> {
  const { data, error } = await supabase.from(view).select('*').eq('tenant_id', tenantId as string).single()
  if (error) throw error
  return (data as T) || null
}

export interface KpisToday { tenant_id: string; leads_today: number; leads_week: number; fu_due_today: number; fu_overdue: number; appt_today: number }
export interface ConversionRates {
  tenant_id: string; l_total: number; l_contacted: number; l_offered: number; l_appointed: number; l_won: number;
  rate_contacted: number; rate_offered: number; rate_appointed: number; rate_won: number
}
export interface SlaTracking {
  tenant_id: string; leads_total: number; contacted_ok: number; offered_ok: number; sla_contacted_pct: number; sla_offered_pct: number;
  sla_contacted_color: 'green'|'yellow'|'red'; sla_offered_color: 'green'|'yellow'|'red'
}
export interface RevenueEstimate { tenant_id: string; gross_estimate: number }

export function useKpiData() {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const enabled = !!activeTenantId && membershipsLoaded

  const { data: kpis, error: e1, isLoading: l1, mutate: r1 } = useSWR<KpisToday | null>(
    enabled ? ['view','v_kpis_today', activeTenantId, user?.id || ''] : null,
    () => fromSingle<KpisToday>('v_kpis_today', activeTenantId as string),
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )
  const { data: conv, error: e2, isLoading: l2, mutate: r2 } = useSWR<ConversionRates | null>(
    enabled ? ['view','v_conversion_rates', activeTenantId, user?.id || ''] : null,
    () => fromSingle<ConversionRates>('v_conversion_rates', activeTenantId as string),
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )
  const { data: sla, error: e3, isLoading: l3, mutate: r3 } = useSWR<SlaTracking | null>(
    enabled ? ['view','v_sla_tracking', activeTenantId, user?.id || ''] : null,
    () => fromSingle<SlaTracking>('v_sla_tracking', activeTenantId as string),
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )
  const { data: rev, error: e4, isLoading: l4, mutate: r4 } = useSWR<RevenueEstimate | null>(
    enabled ? ['view','v_revenue_estimate', activeTenantId, user?.id || ''] : null,
    () => fromSingle<RevenueEstimate>('v_revenue_estimate', activeTenantId as string),
    { revalidateOnFocus: false, refreshInterval: 30000 }
  )

  useEffect(() => {
    if (!activeTenantId) return
    const ch = supabase
      .channel('kpi-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => mutate((key)=>Array.isArray(key)&&key[0]==='view'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => mutate((key)=>Array.isArray(key)&&key[0]==='view'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enhanced_follow_ups' }, () => mutate((key)=>Array.isArray(key)&&key[0]==='view'))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeTenantId])

  return {
    kpis, conv, sla, rev,
    loading: l1 || l2 || l3 || l4,
    error: e1 || e2 || e3 || e4,
    refetch: () => { r1(); r2(); r3(); r4() },
  }
}


