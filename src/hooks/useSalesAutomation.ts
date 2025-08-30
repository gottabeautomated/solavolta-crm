import { useCallback, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getRuleForStatus, buildWebhookURL, calculateEFUDateForStatus, getSLAForStatus, isSLABreached } from '../lib/salesAutomation'
import type { SalesLeadStatus } from '../types/sales'
import { useAuth } from './useAuth'

export interface AutomationResult {
  success: boolean
  efu_created?: string
  webhook_triggered?: boolean
  error?: string
  details?: { rule_triggered: string; efu_due_date?: string; webhook_endpoint?: string }
}

export function useSalesAutomation() {
  const [loading, setLoading] = useState(false)
  const { activeTenantId } = useAuth()

  const triggerAutomation = useCallback(async (
    leadId: string,
    newStatus: SalesLeadStatus,
    oldStatus?: SalesLeadStatus,
    additionalData?: Record<string, any>
  ): Promise<AutomationResult> => {
    if (!activeTenantId) return { success: false, error: 'No active tenant' }
    setLoading(true)
    try {
      const rule = getRuleForStatus(newStatus, additionalData)
      if (!rule) { setLoading(false); return { success: true, details: { rule_triggered: 'none' } } }

      const result: AutomationResult = { success: true, details: { rule_triggered: rule.id } }

      if (rule.action.type === 'create_efu' || rule.action.type === 'both') {
        const efu = rule.action.efu!
        const due = calculateEFUDateForStatus(newStatus, new Date(), additionalData)
        const sla = getSLAForStatus(newStatus)
        const { data, error } = await supabase
          .from('enhanced_follow_ups')
          .insert({
            tenant_id: activeTenantId,
            lead_id: leadId,
            type: efu.type,
            title: efu.title,
            description: efu.description,
            due_date: due.toISOString().split('T')[0],
            priority: efu.priority,
            auto_generated: true,
            triggered_by_status: newStatus,
            sla_target_hours: sla?.target_hours
          })
          .select('id')
          .single()
        if (error) throw error
        result.efu_created = data!.id
        result.details!.efu_due_date = due.toISOString().split('T')[0]
      }

      if (rule.action.type === 'webhook' || rule.action.type === 'both') {
        const { endpoint, payload } = rule.action.webhook!
        const url = buildWebhookURL(endpoint)
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Webhook-Source': 'sales-automation' },
          body: JSON.stringify({ leadId, status: newStatus, previousStatus: oldStatus, tenantId: activeTenantId, timestamp: new Date().toISOString(), ...payload, ...additionalData })
        })
        result.webhook_triggered = res.ok
        result.details!.webhook_endpoint = endpoint
        if (!res.ok) {
          await supabase.from('enhanced_follow_ups').insert({
            tenant_id: activeTenantId,
            lead_id: leadId,
            type: 'manual',
            title: `Webhook-Fehler: ${rule.id}`,
            description: `Automatisierung für Status "${newStatus}" fehlgeschlagen. Manuelle Nachbearbeitung erforderlich.`,
            due_date: new Date().toISOString().split('T')[0],
            priority: 'urgent',
            auto_generated: true,
            triggered_by_status: newStatus
          })
        }
      }

      setLoading(false)
      return result
    } catch (e: any) {
      setLoading(false)
      return { success: false, error: e?.message || 'Unknown error' }
    }
  }, [activeTenantId])

  return { triggerAutomation, loading }
}



