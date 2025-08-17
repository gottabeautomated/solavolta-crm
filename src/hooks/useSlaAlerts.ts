import useSWR, { mutate } from 'swr'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { useEffect, useCallback, useState } from 'react'

export interface SlaBreach { tenant_id: string; breach_type: 'contact_24h'|'offer_48h'|'followup_overdue'; lead_id: string; lead_name?: string | null; due_at: string; level: number }

export function useSlaAlerts() {
  const { activeTenantId, membershipsLoaded, user } = useAuth()
  const key = activeTenantId && membershipsLoaded ? ['view','v_sla_breaches', activeTenantId, user?.id || ''] : null
  const { data, error, isLoading, mutate: revalidate } = useSWR<SlaBreach[]>(
    key,
    async () => {
      const { data, error } = await supabase.from('v_sla_breaches').select('*').eq('tenant_id', activeTenantId as string)
      if (error) {
        const msg = error?.message || ''
        if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
          return [] as SlaBreach[]
        }
        throw error
      }
      return (data || []) as SlaBreach[]
    },
    { refreshInterval: 30000, revalidateOnFocus: false, shouldRetryOnError: false }
  )

  // Enrich missing names by batch-loading leads once
  const [leadLabelMap, setLeadLabelMap] = useState<Record<string,string>>({})
  useEffect(() => {
    (async () => {
      if (!activeTenantId || !data || data.length === 0) return
      const missingIds = data.filter(b => !b.lead_name).map(b => b.lead_id)
      const unique = Array.from(new Set(missingIds.filter(Boolean)))
      if (unique.length === 0) return
      const { data: leads } = await supabase
        .from('leads')
        .select('id,name,email,phone')
        .eq('tenant_id', activeTenantId)
        .in('id', unique)
      const map: Record<string,string> = {}
      for (const l of (leads || [])) {
        const label = (l as any).name || (l as any).email || (l as any).phone || (l as any).id
        map[(l as any).id] = label
      }
      if (Object.keys(map).length > 0) setLeadLabelMap(prev => ({ ...prev, ...map }))
    })()
  }, [activeTenantId, data])

  // Browser Notifications
  useEffect(() => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'default') Notification.requestPermission()
  }, [])

  // Debounced notification: notify only for new unseen items in this session
  const [seen, setSeen] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!data || data.length === 0) return
    const incoming = data.filter(b => !seen[b.lead_id + '_' + b.breach_type])
    if (incoming.length === 0) return
    incoming.forEach(b => {
      if (Notification.permission === 'granted') {
        const title = b.breach_type === 'contact_24h' ? 'SLA: Erstkontakt überfällig' : b.breach_type === 'offer_48h' ? 'SLA: Angebot 48h' : 'Follow-up überfällig'
        const who = b.lead_name || leadLabelMap[b.lead_id] || b.lead_id
        new Notification(title, { body: `${who} • fällig seit ${new Date(b.due_at).toLocaleString('de-DE')}` })
      }
    })
    const added: Record<string, number> = {}
    incoming.forEach(b => { added[b.lead_id + '_' + b.breach_type] = Date.now() })
    setSeen(prev => ({ ...prev, ...added }))
  }, [data, leadLabelMap, seen])

  useEffect(() => {
    if (!activeTenantId) return
    const ch = supabase
      .channel(`sla-realtime-${activeTenantId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads', filter: `tenant_id=eq.${activeTenantId}` }, () => revalidate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `tenant_id=eq.${activeTenantId}` }, () => revalidate())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'enhanced_follow_ups', filter: `tenant_id=eq.${activeTenantId}` }, () => revalidate())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeTenantId, revalidate])

  const snooze = useCallback(async (leadId: string, minutes: number) => {
    // Client-side only snooze via localStorage; production: store in DB table alerts_ack
    const key = `sla_snooze_${leadId}`
    const until = Date.now() + minutes*60*1000
    localStorage.setItem(key, String(until))
    revalidate()
  }, [revalidate])

  const acknowledge = useCallback(async (leadId: string) => {
    const key = `sla_ack_${leadId}`
    localStorage.setItem(key, String(Date.now()))
    revalidate()
  }, [revalidate])

  const visible = (data || []).filter(b => {
    const snoozeKey = `sla_snooze_${b.lead_id}`
    const ackKey = `sla_ack_${b.lead_id}`
    const snoozedUntil = parseInt(localStorage.getItem(snoozeKey) || '0', 10)
    const ackAt = parseInt(localStorage.getItem(ackKey) || '0', 10)
    const now = Date.now()
    if (snoozedUntil && snoozedUntil > now) return false
    if (ackAt && ackAt > 0) return false
    return true
  })

  return { alerts: visible, loading: isLoading, error, revalidate, snooze, acknowledge }
}


