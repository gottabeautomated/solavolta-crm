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
      const { error: historyError } = await supabase
        .from('status_changes')
        .insert({
          lead_id: leadId,
          old_status: oldLead.lead_status,
          new_status: newLead.lead_status,
          changed_by: userId,
          reason,
          notes: `Telefonstatus: ${oldLead.phone_status} → ${newLead.phone_status}`
        })

      if (historyError) {
        throw new Error(`Fehler beim Speichern der Status-Historie: ${historyError.message}`)
      }

      // Benachrichtigung erstellen wenn nötig
      if (shouldNotifyStatusChange(oldLead, newLead)) {
        await createStatusNotification(leadId, oldLead, newLead, userId)
      }

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
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          lead_id: leadId,
          type: 'status_change',
          title,
          message,
          read: false
        })
    }
  }, [])

  const getStatusHistory = useCallback(async (leadId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('status_changes')
        .select('*')
        .eq('lead_id', leadId)
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