import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { Lead } from '../types/leads'

export const leadsKeys = {
  all: (tenantId: string, userId?: string | null, scope: 'all' | 'own' = 'own') => ['leads', tenantId, scope, userId || 'none'] as const,
  detail: (tenantId: string, leadId: string) => ['leads', tenantId, 'detail', leadId] as const,
}

export function useLeadsQuery() {
  const { activeTenantId, membershipsLoaded, user, tenants } = useAuth()
  const tenantId = activeTenantId as string | null
  const role = tenants.find(t => t.id===tenantId)?.role || null
  const isAdmin = role==='owner' || role==='admin' || role==='sales_admin'
  const scope: 'all'|'own' = isAdmin ? 'all' : 'own'

  const enabled = !!tenantId && membershipsLoaded
  const queryKey = useMemo(() => tenantId ? leadsKeys.all(tenantId, user?.id || null, scope) : ['leads','disabled'], [tenantId, user?.id, scope])

  const query = useQuery({
    queryKey,
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<Lead[]> => {
      if (!tenantId) return []
      let q = supabase.from('leads').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
      if (!isAdmin && user?.id) q = q.eq('user_id', user.id)
      const { data, error } = await q
      if (error) throw error
      return (data || []) as Lead[]
    },
  })

  return query
}

export function useLeadDetailQuery(leadId: string) {
  const { activeTenantId, membershipsLoaded, user, tenants } = useAuth()
  const tenantId = activeTenantId as string | null
  const role = tenants.find(t => t.id===tenantId)?.role || null
  const isAdmin = role==='owner' || role==='admin' || role==='sales_admin'
  const enabled = !!tenantId && membershipsLoaded && !!leadId

  return useQuery({
    queryKey: tenantId ? leadsKeys.detail(tenantId, leadId) : ['leads','detail','disabled'],
    enabled,
    queryFn: async (): Promise<Lead | null> => {
      if (!tenantId) return null
      let q = supabase.from('leads').select('*').eq('tenant_id', tenantId).eq('id', leadId)
      if (!isAdmin && user?.id) q = q.eq('user_id', user.id)
      const { data, error } = await q.single()
      if (error) throw error
      return data as Lead
    },
  })
}

export function useInvalidateLeads() {
  const qc = useQueryClient()
  const { activeTenantId, user, tenants } = useAuth()
  const tenantId = activeTenantId as string
  const role = tenants.find(t => t.id===tenantId)?.role || null
  const isAdmin = role==='owner' || role==='admin' || role==='sales_admin'
  const scope: 'all'|'own' = isAdmin ? 'all' : 'own'
  return () => qc.invalidateQueries({ queryKey: leadsKeys.all(tenantId, user?.id || null, scope) })
}


