import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export type NotificationActionData =
  | { tel: string }
  | { lead_id: string; section?: string }
  | { appointment_id: string }
  | { efu_id: string }
  | { kind: 'offer_overdue' | 'contact_overdue'; lead_id: string }

export interface Notification {
  id: string
  user_id: string
  lead_id?: string
  tenant_id: string
  type: 'lead_status_change' | 'new_lead_assigned' | 'offer_overdue' | 'sla_breach' | 'n8n_workflow_error' | 'system_maintenance' | 'followup_due' | 'appointment_reminder'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  action_data_json?: NotificationActionData
  snoozed_until?: string | null
  category?: string
  archived_at?: string | null
}

export function useNotifications() {
  const { user, activeTenantId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supportsArchivedAtRef = useRef<boolean>(
    typeof window === 'undefined' ? false : localStorage.getItem('sv_supports_archived_at') === 'true'
  )

  const fetchNotifications = useCallback(async () => {
    if (!user || !activeTenantId) return
    setLoading(true)
    setError(null)
    try {
      const base = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(50)

      const resp = supportsArchivedAtRef.current
        ? await base.is('archived_at', null)
        : await base

      if (resp.error) {
        const code = (resp.error as any)?.code
        const msg = String(resp.error?.message || '')
        if (supportsArchivedAtRef.current && (code === '42703' || msg.includes('archived_at'))) {
          supportsArchivedAtRef.current = false
          try { localStorage.setItem('sv_supports_archived_at', 'false') } catch {}
          const fallback = await base
          if (fallback.error) throw fallback.error
          setNotifications((fallback.data as Notification[]) || [])
          return
        }
        throw resp.error
      }
      setNotifications((resp.data as Notification[]) || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fehler beim Laden der Benachrichtigungen'
      setError(message)
      if (import.meta.env.DEV) console.error('Fehler beim Laden der Benachrichtigungen:', err)
    } finally {
      setLoading(false)
    }
  }, [user, activeTenantId])

  const createNotification = useCallback(async (notificationData: {
    lead_id?: string
    type: Notification['type']
    title: string
    message: string
    action_url?: string
    priority?: Notification['priority']
    action_data_json?: NotificationActionData
    category?: string
  }) => {
    if (!user || !activeTenantId) return { data: null, error: new Error('Kein User oder Tenant aktiv') }
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{ ...notificationData, user_id: user.id, tenant_id: activeTenantId }])
        .select()
        .single()
      if (!error && data) setNotifications(prev => [data, ...prev])
      return { data, error }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Fehler beim Erstellen der Benachrichtigung') }
    }
  }, [user, activeTenantId])

  const snooze = useCallback(async (id: string, preset: '1h'|'4h'|'tomorrow9'|'nextweek'|'custom', customDateISO?: string) => {
    if (!user || !activeTenantId) return { error: new Error('Kein User/Tenant') }
    const base = new Date()
    let until: Date
    if (preset === '1h') until = new Date(base.getTime() + 60*60*1000)
    else if (preset === '4h') until = new Date(base.getTime() + 4*60*60*1000)
    else if (preset === 'tomorrow9') { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); until = d }
    else if (preset === 'nextweek') { const d = new Date(); const day = d.getDay(); const diff = (8 - day) % 7 || 7; d.setDate(d.getDate()+diff); d.setHours(9,0,0,0); until = d }
    else if (preset === 'custom' && customDateISO) until = new Date(customDateISO)
    else return { error: new Error('Ungültiger Snooze') }
    const { error } = await supabase.from('notifications').update({ snoozed_until: until.toISOString() }).eq('id', id).eq('user_id', user.id).eq('tenant_id', activeTenantId)
    if (!error) setNotifications(prev => prev.map(n => n.id===id? { ...n, snoozed_until: until.toISOString() } : n))
    return { error }
  }, [user, activeTenantId])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('tenant_id', activeTenantId)
      if (!error) setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Fehler beim Markieren') }
    }
  }, [user, activeTenantId])

  const markAllAsRead = useCallback(async () => {
    if (!user || !activeTenantId) return
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('tenant_id', activeTenantId)
        .eq('read', false)
      if (!error) setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      return { error }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Fehler beim Markieren aller') }
    }
  }, [user, activeTenantId])

  const nowTs = Date.now()
  const active = notifications.filter(n => !n.snoozed_until || new Date(n.snoozed_until).getTime() <= nowTs)
  const snoozed = notifications.filter(n => n.snoozed_until && new Date(n.snoozed_until).getTime() > nowTs)
  const unreadCount = active.filter(n => !n.read).length

  useEffect(() => {
    if (!user || !activeTenantId) return
    const subscription = supabase
      .channel('notifications-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new as Notification
        if (newNotification.tenant_id === activeTenantId) {
          setNotifications(prev => [newNotification, ...prev])
        }
      })
      .subscribe()
    return () => subscription.unsubscribe()
  }, [user, activeTenantId])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  return { notifications, active, snoozed, loading, error, unreadCount, fetchNotifications, createNotification, markAsRead, markAllAsRead, snooze, refetch: fetchNotifications }
}


