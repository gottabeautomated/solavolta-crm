import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { StatusChange, Lead } from '../../types/leads'
import { applyStatusRules, shouldNotifyStatusChange } from '../../utils/status/statusRules'

export function useStatusTracking() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trackStatusChange = useCallback(async (
    leadId: string,
    oldLead: Lead,
    newLead: Lead,
    userId: string,
    reason?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      // Status-Änderung in Historie speichern
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) {
        throw new Error('Kein aktiver Mandant gewählt')
      }
      const { error: historyError } = await supabase
        .from('status_changes')
        .insert({
          lead_id: leadId,
          old_status: oldLead.lead_status,
          new_status: newLead.lead_status,
          changed_by: userId,
          reason,
          notes: `Telefonstatus: ${oldLead.phone_status} → ${newLead.phone_status}`,
          tenant_id: tenantId as any
        })

      if (historyError) {
        throw new Error(`Fehler beim Speichern der Status-Historie: ${historyError.message}`)
      }

      // Benachrichtigung erstellen wenn nötig
      if (shouldNotifyStatusChange(oldLead, newLead)) {
        await createStatusNotification(leadId, oldLead, newLead, userId)
      }

      // Auto-Followups gemäß Regeln planen
      await ensureAutomaticFollowUps(leadId, oldLead, newLead)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const createStatusNotification = useCallback(async (
    leadId: string,
    oldLead: Lead,
    newLead: Lead,
    userId: string
  ) => {
    let title = 'Status-Änderung'
    let message = ''

    if (oldLead.lead_status !== newLead.lead_status) {
      title = `Lead-Status geändert: ${oldLead.lead_status || 'Kein Status'} → ${newLead.lead_status}`
      message = `Lead "${newLead.name}" Status wurde geändert`
    } else if (oldLead.phone_status !== newLead.phone_status) {
      title = `Telefonstatus geändert: ${oldLead.phone_status || 'Kein Status'} → ${newLead.phone_status}`
      message = `Telefonstatus für "${newLead.name}" wurde aktualisiert`
    } else if (!oldLead.follow_up && newLead.follow_up) {
      title = 'Follow-up erstellt'
      message = `Follow-up für "${newLead.name}" am ${newLead.follow_up_date} erstellt`
    }

    if (message) {
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) return
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          lead_id: leadId,
          type: 'status_change',
          title,
          message,
          read: false,
          tenant_id: tenantId as any
        })
    }
  }, [])

  const getStatusHistory = useCallback(async (leadId: string) => {
    setLoading(true)
    setError(null)

    try {
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) {
        throw new Error('Kein aktiver Mandant gewählt')
      }
      const { data, error } = await supabase
        .from('status_changes')
        .select('*')
        .eq('lead_id', leadId)
        .eq('tenant_id', tenantId as any)
        .order('changed_at', { ascending: false })

      if (error) {
        throw new Error(`Fehler beim Laden der Status-Historie: ${error.message}`)
      }

      return { data: data as StatusChange[], error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  const applyAutomaticUpdates = useCallback(async (lead: Lead) => {
    const updates = applyStatusRules(lead)
    
    if (Object.keys(updates).length > 0) {
      // Automatische Updates anwenden
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', lead.id)
        .select()
        .single()

      if (error) {
        throw new Error(`Fehler bei automatischen Updates: ${error.message}`)
      }

      return { data, updates }
    }

    return { data: lead, updates: {} }
  }, [])

  return {
    trackStatusChange,
    getStatusHistory,
    applyAutomaticUpdates,
    loading,
    error
  }
} 

// --- Auto Follow-up Logik ---
async function ensureAutomaticFollowUps(leadId: string, oldLead: Lead, newLead: Lead) {
  const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
  if (!tenantId) return

  const upsertAuto = async (
    type: 'call' | 'offer_followup' | 'meeting',
    dueInDays: number,
    priority: 'low' | 'medium' | 'high' | 'overdue',
    note?: string
  ) => {
    const due = new Date()
    due.setDate(due.getDate() + dueInDays)
    const dueISO = due.toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('enhanced_follow_ups')
      .select('id, due_date, priority')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId as any)
      .eq('type', type)
      .eq('auto_generated', true)
      .is('completed_at', null)
      .limit(1)
    const ex = existing && existing[0]
    if (ex) {
      const exDate = new Date(ex.due_date as string)
      if (exDate > due || rank(ex.priority as any) < rank(priority)) {
        await supabase.from('enhanced_follow_ups').update({ due_date: dueISO, priority }).eq('id', ex.id as string)
      }
      return
    }
    await supabase.from('enhanced_follow_ups').insert({
      tenant_id: tenantId as any,
      lead_id: leadId,
      type,
      due_date: dueISO,
      priority,
      auto_generated: true,
      escalation_level: 0,
      notes: note || null,
    })
  }

  const wasOfferSent = (!oldLead.offer_pv && newLead.offer_pv) || (!oldLead.offer_storage && newLead.offer_storage) || (!oldLead.offer_backup && newLead.offer_backup) || (!oldLead.tvp && newLead.tvp)
  // Telefon-Kaskade: bei nicht erreichbar Follow-up am nächsten Arbeitstag
  const phoneNotReached = newLead.phone_status === 'nicht_erreichbar' || newLead.phone_status === 'zurueckrufen'
  if (phoneNotReached) await upsertAuto('call', 1, 'medium', 'Auto: Nicht erreicht')
  if (wasOfferSent) await upsertAuto('offer_followup', 7, 'medium', 'Auto: Angebot versandt')

  if (newLead.appointment_date) {
    try {
      const dt = new Date(`${newLead.appointment_date}T${newLead.appointment_time || '09:00'}:00`)
      if (!isNaN(dt.getTime()) && dt < new Date()) await upsertAuto('meeting', 0, 'high', 'Auto: Termin überfällig')
    } catch {}
  }

  // Eskalation
  await escalateAutoFollowUps(leadId, tenantId as any)
}

function rank(p: 'low' | 'medium' | 'high' | 'overdue') { return p === 'overdue' ? 4 : p === 'high' ? 3 : p === 'medium' ? 2 : 1 }

async function escalateAutoFollowUps(leadId: string, tenantId: string) {
  const { data: open } = await supabase
    .from('enhanced_follow_ups')
    .select('id, due_date, escalation_level, priority')
    .eq('lead_id', leadId)
    .eq('tenant_id', tenantId)
    .eq('auto_generated', true)
    .is('completed_at', null)

  const today = new Date()
  for (const fu of open || []) {
    const due = new Date(fu.due_date as string)
    const overdueDays = Math.floor((today.getTime() - due.getTime()) / (1000*60*60*24))
    let lvl = fu.escalation_level as number
    let prio = fu.priority as 'low' | 'medium' | 'high' | 'overdue'
    if (overdueDays >= 10 && lvl < 3) { lvl = 3; prio = 'overdue' }
    else if (overdueDays >= 5 && lvl < 2) { lvl = 2; prio = 'high' }
    else if (overdueDays >= 2 && lvl < 1) { lvl = 1; prio = 'high' }
    if (lvl !== fu.escalation_level) {
      await supabase.from('enhanced_follow_ups').update({ escalation_level: lvl, priority: prio, due_date: new Date().toISOString().slice(0,10) }).eq('id', fu.id as string)
    }
  }
}