import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { 
  Lead, 
  CreateLeadInput, 
  UpdateLeadInput,
  DatabaseResponse
} from '../types/leads'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
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
  }, [activeTenantId, membershipsLoaded])

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
  const updateLead = useCallback(async (leadData: UpdateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      if (!membershipsLoaded || !activeTenantId) {
        return { data: null, error: new Error('Kein aktiver Mandant gewählt') }
      }
      const tenantId = activeTenantId
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
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
      }

      if (error) return { data: null, error: new Error(error.message) }
      return { data, error: null }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Aktualisieren des Leads') 
      }
    }
  }, [activeTenantId, membershipsLoaded, isAdmin])

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
