import { useState, useCallback } from 'react'
import { appointmentService, type AppointmentRequest, type AppointmentResponse } from '../lib/appointmentService'
import { supabase } from '../lib/supabase'
import type { Appointment } from '../types/leads'

export function useAppointments() {
  const [isCreating, setIsCreating] = useState(false)
  const [lastResult, setLastResult] = useState<AppointmentResponse | null>(null)

  const createAppointment = useCallback(async (appointmentData: AppointmentRequest): Promise<AppointmentResponse> => {
    setIsCreating(true)
    setLastResult(null)
    try {
      const result = await appointmentService.createAppointment(appointmentData)
      setLastResult(result)
      return result
    } catch (error) {
      const errorResult: AppointmentResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setIsCreating(false)
    }
  }, [])

  const clearResult = useCallback(() => setLastResult(null), [])

  // Direkt in Supabase speichern (Single Source of Truth)
  const createLocalAppointment = useCallback(async (leadId: string, dateISO: string, timeHHmm: string, notes?: string) => {
    try {
      setIsCreating(true)
      setLastResult(null)
      const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
      if (!tenantId) throw new Error('Kein aktiver Mandant gesetzt')
      // Erzeuge UTC-ISO aus lokaler Datum+Zeit, damit timestamptz korrekt in der DB landet
      const local = new Date(`${dateISO}T${timeHHmm}:00`)
      const startsAt = local.toISOString()
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ tenant_id: tenantId as any, lead_id: leadId, starts_at: startsAt, notes: notes || null }])
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      const ok: AppointmentResponse = { success: true, appointment: { calendar_event_id: '', calendar_link: '', lead_id: leadId } }
      setLastResult(ok)
      return ok
    } catch (e) {
      const fail: AppointmentResponse = { success: false, error: e instanceof Error ? e.message : 'Unbekannter Fehler' }
      setLastResult(fail)
      return fail
    } finally {
      setIsCreating(false)
    }
  }, [])

  // Optionaler Webhook-Trigger (n8n)
  const triggerAppointmentWebhook = useCallback(async (payload: AppointmentRequest): Promise<AppointmentResponse> => {
    const res = await appointmentService.createAppointment(payload)
    setLastResult(res)
    return res
  }, [])

  // Termine lesen (memoisiert, stabile Referenzen)
  const listAppointments = useCallback(async (leadId: string): Promise<Appointment[]> => {
    const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
    if (!tenantId) return []
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId as any)
      .order('starts_at', { ascending: true })
    return data || []
  }, [])

  const getNextAppointment = useCallback(async (leadId: string): Promise<Appointment | null> => {
    const tenantId = typeof window !== 'undefined' ? window.localStorage.getItem('activeTenantId') : null
    if (!tenantId) return null
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('lead_id', leadId)
      .eq('tenant_id', tenantId as any)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
    return (data && data[0]) || null
  }, [])

  const deleteAppointment = useCallback(async (appointmentId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
      if (error) throw new Error(error.message)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unbekannter Fehler' }
    }
  }, [])

  return {
    isCreating,
    lastResult,
    createAppointment,
    createLocalAppointment,
    triggerAppointmentWebhook,
    clearResult,
    generateTimeSlots: appointmentService.generateTimeSlots.bind(appointmentService),
    isValidAppointmentDate: appointmentService.isValidAppointmentDate.bind(appointmentService),
    isValidTimeSlot: appointmentService.isValidTimeSlot.bind(appointmentService),
    listAppointments,
    getNextAppointment,
    deleteAppointment,
  }
}


