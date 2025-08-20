import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { 
  Lead, 
  CreateLeadInput, 
  UpdateLeadInput,
  DatabaseResponse,
  LeadStatus,
  PhoneStatus
} from '../types/leads'
import type { EnhancedFollowUp } from '../types/status' // Moved to top-level
import { useEnhancedFollowUps } from './useEnhancedFollowUps'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const { create: createFollowUp } = useEnhancedFollowUps()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { activeTenantId, membershipsLoaded, user, tenants } = useAuth()

  const currentRole = useMemo(() => {
    return tenants.find(t => t.id === activeTenantId)?.role || null
  }, [tenants, activeTenantId])
  const isAdmin = currentRole === 'owner' || currentRole === 'admin' || currentRole === 'sales_admin'

  // Vereinfachtes fetchLeads - lädt alle Leads ohne Filter
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Warte, bis Memberships geladen sind und ein aktiver Tenant gesetzt ist
      if (!membershipsLoaded || !activeTenantId) {
        setLeads([])
        setLoading(false)
        return
      }

      const tenantId = activeTenantId as string
      let query = supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query

      if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Leads'
      setError(errorMessage)
      if (import.meta.env.DEV) console.error('Fehler beim Laden der Leads:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTenantId, membershipsLoaded, isAdmin, user?.id])

  // Einzelnen Lead laden
  const fetchLead = useCallback(async (id: string): Promise<DatabaseResponse<Lead>> => {
    try {
      if (!membershipsLoaded || !activeTenantId) {
        return { data: null, error: new Error('Kein aktiver Mandant gewählt') }
      }
      const tenantId = activeTenantId as string
      let query = supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .eq('tenant_id', tenantId)
      if (!isAdmin && user?.id) {
        query = query.eq('user_id', user.id)
      }
      const { data, error } = await query.single()

      if (error) return { data: null, error: new Error(error.message) }
      return { data, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Unbekannter Fehler') 
      }
    }
  }, [activeTenantId, membershipsLoaded, isAdmin, user?.id])

  // Neuen Lead erstellen
  const createLead = useCallback(async (leadData: CreateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      // Get current user and active tenant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Benutzer nicht authentifiziert')
      }

      // Hole aktiven Tenant aus LocalStorage (wird in AuthContext gesetzt)
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) {
        throw new Error('Kein aktiver Mandant gewählt')
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id, tenant_id: tenantId }])
        .select()
        .single()

      if (!error && data) {
        // Optimistic Update: Lead zur lokalen Liste hinzufügen
        setLeads(prevLeads => [data, ...prevLeads])
      }

      if (error) return { data: null, error: new Error(error.message) }
      return { data, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Erstellen des Leads') 
      }
    }
  }, [])

  // Lead aktualisieren
  // Status-Überführungshilfsfunktionen
  const determineNewStatus = (currentLead: Lead, updates: Partial<Lead>): LeadStatus => {
    // Automatische Status-Änderung bei Angebotshochladen
    if (updates.offer_pv && !currentLead.offer_pv) {
      return 'Angebot übermittelt' as LeadStatus;
    }
    
    // Automatische Status-Änderung bei TVP
    if (updates.tvp && !currentLead.tvp) {
      return 'TVP' as LeadStatus;
    }
    
    // Manuelle Status-Änderung nur wenn wirklich geändert
    if (updates.lead_status && updates.lead_status !== currentLead.lead_status) {
      return updates.lead_status as LeadStatus;
    }

    // Kunde erreicht → bevorzugt gegenüber Nicht-erreicht-Kaskade
    if ((updates as any).phone_status === 'erreichbar') {
      const hasAppointment = Boolean((updates as any).appointment_date || (updates as any).next_action === 'appointment' || (currentLead as any).appointment_date)
      if (hasAppointment) {
        return 'Termin vereinbart' as LeadStatus
      }
      return 'In Bearbeitung' as LeadStatus
    }

    // Telefon-Kaskade basierend auf nicht erreicht Zähler
    const notReached = (updates as any).not_reached_count ?? (currentLead as any).not_reached_count
    if (typeof notReached === 'number' && notReached >= 0) {
      if (notReached === 1) return 'Nicht erreicht 1x' as LeadStatus
      if (notReached === 2) return 'Nicht erreicht 2x' as LeadStatus
      if (notReached >= 3) return 'Nicht erreicht 3x' as LeadStatus
    }
    
    // Status bleibt unverändert
    return currentLead.lead_status;
  };

  const generateFollowUpsForStatus = (lead: Lead, newStatus: LeadStatus): EnhancedFollowUp[] => {
    const followUps: EnhancedFollowUp[] = [];
    const today = new Date();
    
    switch(newStatus) {
      case 'Nicht erreicht 1x': {
        // Wiedervorlage nächster Arbeitstag
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'Rückrufversuch 2',
          due_date: addDays(today, 1),
          type: 'call',
          priority: 'medium',
          auto_generated: true,
          escalation_level: 0,
          notes: 'Auto: 1x nicht erreicht'
        } as any)
        break
      }
      case 'Nicht erreicht 2x': {
        // Wiedervorlage in 6 Arbeitstagen (~8 Kalendertage inkl. WE)
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'Rückrufversuch 3',
          due_date: addDays(today, 8),
          type: 'call',
          priority: 'medium',
          auto_generated: true,
          escalation_level: 0,
          notes: 'Auto: 2x nicht erreicht'
        } as any)
        break
      }
      case 'Nicht erreicht 3x': {
        // E-Mail Trigger über EFU notieren (externes n8n kann Email versenden)
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'E-Mail an Lead (3x nicht erreicht)',
          due_date: addDays(today, 0),
          type: 'custom',
          priority: 'high',
          auto_generated: true,
          escalation_level: 1,
          notes: 'Auto: 3x nicht erreicht – E-Mail anstoßen'
        } as any)
        break
      }
      case 'Angebot übermittelt':
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '', // Annahme: tenant_id ist immer vorhanden
          title: 'Angebotsbestätigung' as string,
          due_date: addDays(today, 1),
          type: 'offer',
          priority: 'medium',
          auto_generated: true,
          escalation_level: 0,
        });
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'Follow-up nach Angebot' as string,
          due_date: addDays(today, 7),
          type: 'followup',
          priority: 'medium',
          auto_generated: true,
          escalation_level: 0,
        });
        break;
        
      case 'TVP':
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'TVP-Bestätigung' as string,
          due_date: addDays(today, 1),
          type: 'tvp',
          priority: 'medium',
          auto_generated: true,
          escalation_level: 0,
        });
        followUps.push({
          lead_id: lead.id,
          tenant_id: lead.tenant_id || '',
          title: 'Abschlussfollow-up' as string,
          due_date: addDays(today, 3),
          type: 'followup',
          priority: 'high',
          auto_generated: true,
          escalation_level: 0,
        });
        break;
        
      case 'Verloren':
        if (lead.lost_reason === 'kein_interesse') {
          followUps.push({
            lead_id: lead.id,
            tenant_id: lead.tenant_id || '',
          title: 'Re-Engagement-Versuch',
            due_date: addDays(today, 30),
            type: 'reengagement',
            priority: 'low',
            auto_generated: true,
            escalation_level: 0,
          });
        }
        break;
    }
    return followUps;
  };

  // Dynamic options based on phone status
  const getNextActionOptions = (phoneStatus: PhoneStatus | null) => {
    if (phoneStatus === 'erreichbar') {
      return [
        { value: 'appointment', label: 'Termin' },
        { value: 'offer', label: 'Angebot' }
      ]
    } else if (phoneStatus === 'nicht_erreichbar' || phoneStatus === 'zurueckrufen') {
      return [
        { value: 'follow_up', label: 'Wiedervorlage' }
      ]
    } else if (phoneStatus === 'termin_vereinbart') {
      return [
        { value: 'note', label: 'Notiz: Termin bereits vereinbart' }
      ]
    }
    return []
  }

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const updateLead = useCallback(async (leadData: UpdateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      if (!membershipsLoaded || !activeTenantId) {
        return { data: null, error: new Error('Kein aktiver Mandant gewählt') }
      }
      
      // Bestehenden Lead laden
      const { data: currentLead } = await fetchLead(leadData.id);
      if (!currentLead) {
        return { data: null, error: new Error('Lead nicht gefunden') }
      }
      
      // Neuen Status bestimmen
      const newStatus = determineNewStatus(currentLead, leadData);
      const updatedData = { ...leadData, lead_status: newStatus };
      
      const tenantId = activeTenantId
      const { data, error } = await supabase
        .from('leads')
        .update(updatedData)
        .eq('id', leadData.id)
        .eq('tenant_id', tenantId as string)
        .select()
        .single()

      if (!error && data) {
        // Optimistic Update: Lead in lokaler Liste aktualisieren
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === data.id ? data : lead
          )
        )
        
        // Follow-ups generieren wenn Status geändert wurde
        if (newStatus !== currentLead.lead_status) {
          const followUps = generateFollowUpsForStatus(data, newStatus);
          await Promise.all(followUps.map(fu => createFollowUp(fu as any)));

          // Webhook triggern bei "Nicht erreicht 3x" (E-Mail Versand via n8n)
          if (newStatus === ('Nicht erreicht 3x' as any)) {
            const webhookUrl = (import.meta as any)?.env?.VITE_NOT_REACHED_EMAIL_WEBHOOK_URL as string | undefined
            const url = webhookUrl || 'http://localhost:5678/webhook/not-reached-3x-email'
            try {
              await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead_id: data.id, tenant_id: data.tenant_id })
              })
            } catch (e) {
              if (import.meta.env.DEV) console.error('3x nicht erreicht Webhook fehlgeschlagen', e)
            }
          }
        }

        // Aufgabe erstellen, wenn nächste Aktion "offer" gesetzt wurde
        if ((leadData as any).next_action === 'offer' && currentLead.next_action !== 'offer') {
          const todayISO = new Date().toISOString().slice(0,10)
          await createFollowUp({
            lead_id: data.id,
            tenant_id: data.tenant_id || '',
            type: 'offer_followup' as any,
            due_date: todayISO,
            priority: 'medium' as any,
            auto_generated: false,
            escalation_level: 0,
            notes: 'Angebot im Leadprofil hochladen'
          } as any)
        }
      }

      if (error) return { data: null, error: new Error(error.message) }
      return { data, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Aktualisieren des Leads') 
      }
    }
  }, [activeTenantId, membershipsLoaded, isAdmin, fetchLead, createFollowUp])

  // Lead löschen
  const deleteLead = useCallback(async (id: string): Promise<DatabaseResponse<void>> => {
    try {
      if (!membershipsLoaded || !activeTenantId) {
        return { data: null, error: new Error('Kein aktiver Mandant gewählt') }
      }
      const tenantId = activeTenantId
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId as string)

      if (!error) {
        // Optimistic Update: Lead aus lokaler Liste entfernen
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id))
      }

      if (error) return { data: null, error: new Error(error.message) }
      return { data: null, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Löschen des Leads') 
      }
    }
  }, [activeTenantId, membershipsLoaded, isAdmin])

  // Refetch - Alias für fetchLeads für Backwards Compatibility
  const refetch = useCallback(() => {
    return fetchLeads()
  }, [fetchLeads])

  // Initiales Laden beim Mount
  useEffect(() => {
    if (membershipsLoaded) {
      fetchLeads()
    }
  }, [fetchLeads, membershipsLoaded])

  return {
    // State
    leads,
    loading,
    error,
    
    // Actions
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    refetch
  }
}
