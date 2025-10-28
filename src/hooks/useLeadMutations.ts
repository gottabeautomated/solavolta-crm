import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { CreateLeadInput, Lead, UpdateLeadInput } from '../types/leads'
import { leadsKeys, useInvalidateLeads } from './useLeadsQuery'

function toast(msg: string) {
  if (typeof window !== 'undefined') alert(msg)
}

export function useLeadMutations() {
  const { activeTenantId } = useAuth()
  const tenantId = activeTenantId as string
  const invalidate = useInvalidateLeads()

  const create = useMutation({
    mutationKey: ['lead','create', tenantId],
    mutationFn: async (payload: CreateLeadInput): Promise<Lead> => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!tenantId || !userId) throw new Error('Kein aktiver Mandant oder Benutzer')
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...payload, tenant_id: tenantId, user_id: userId }])
        .select('*').single()
      if (error) throw error
      return data as Lead
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast(`Lead erstellen fehlgeschlagen: ${e?.message || e}`),
  })

  const update = useMutation({
    mutationKey: ['lead','update', tenantId],
    mutationFn: async (payload: UpdateLeadInput): Promise<Lead> => {
      // Legacy-Felder entfernen, um 400er bei Schema-Cache zu vermeiden
      const sanitized: any = { ...payload }
      // follow_up Felder jetzt wieder erlaubt – nicht entfernen
      delete sanitized.appointment_time
      delete sanitized.appointment_date
      delete sanitized.appointment_channel
      delete sanitized.appointment_completed

      const safeColumns = [
        'id','created_at','updated_at','name','phone','email','address','status_since','lead_status','contact_type','phone_status',
        'offer_pv','offer_storage','offer_backup','tvp','documentation','doc_link','offers','exported_to_sap','lat','lng',
        'follow_up','follow_up_date',
        'next_action','next_action_date','next_action_time','preliminary_offer','lost_reason','offer_created_at','offer_sent_at','offer_amount','offer_link',
        'won_at','lost_competitor','paused_until','pause_reason','voicemail_left','phone_switched_off','not_reached_count','pv_kwp','storage_kwh',
        'has_backup','has_ev_charger','has_heating_mgmt','quick_notes','tenant_id','user_id','archived'
      ].join(',')

      const { data, error } = await supabase
        .from('leads')
        .update(sanitized)
        .eq('id', payload.id)
        .eq('tenant_id', tenantId)
        .select(safeColumns).single()
      if (error) throw error
      return data as Lead
    },
    onMutate: async (payload) => {
      // Optional: optimistic updates via query cache
      // Skipping for brevity; React Query 5 supports updater functions per cache entry
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast(`Lead aktualisieren fehlgeschlagen: ${e?.message || e}`),
  })

  const remove = useMutation({
    mutationKey: ['lead','delete', tenantId],
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)
      if (error) throw error
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast(`Lead löschen fehlgeschlagen: ${e?.message || e}`),
  })

  return { create, update, remove }
}


