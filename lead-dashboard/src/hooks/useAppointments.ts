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

  return {
    isCreating,
    lastResult,
    createAppointment,
    clearResult,
    generateTimeSlots: appointmentService.generateTimeSlots.bind(appointmentService),
    isValidAppointmentDate: appointmentService.isValidAppointmentDate.bind(appointmentService),
    isValidTimeSlot: appointmentService.isValidTimeSlot.bind(appointmentService),
    listAppointments,
    getNextAppointment,
  }
}


