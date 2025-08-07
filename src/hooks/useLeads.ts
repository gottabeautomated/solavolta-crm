import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
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

  // Vereinfachtes fetchLeads - lädt alle Leads ohne Filter
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Leads'
      setError(errorMessage)
      console.error('Fehler beim Laden der Leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Einzelnen Lead laden
  const fetchLead = useCallback(async (id: string): Promise<DatabaseResponse<Lead>> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Unbekannter Fehler') 
      }
    }
  }, [])

  // Neuen Lead erstellen
  const createLead = useCallback(async (leadData: CreateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      // Get current user ID for RLS
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Benutzer nicht authentifiziert')
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id }])
        .select()
        .single()

      if (!error && data) {
        // Optimistic Update: Lead zur lokalen Liste hinzufügen
        setLeads(prevLeads => [data, ...prevLeads])
      }

      return { data, error }
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
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', leadData.id)
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

      return { data, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Aktualisieren des Leads') 
      }
    }
  }, [])

  // Lead löschen
  const deleteLead = useCallback(async (id: string): Promise<DatabaseResponse<void>> => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (!error) {
        // Optimistic Update: Lead aus lokaler Liste entfernen
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id))
      }

      return { data: null, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Löschen des Leads') 
      }
    }
  }, [])

  // Refetch - Alias für fetchLeads für Backwards Compatibility
  const refetch = useCallback(() => {
    return fetchLeads()
  }, [fetchLeads])

  // Initiales Laden beim Mount
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

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
