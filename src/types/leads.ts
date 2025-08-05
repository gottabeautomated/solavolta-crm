export interface Lead {
  id: string
  created_at: string
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  status_since: string | null
  lead_status: string | null
  contact_type: string | null
  phone_status: string | null
  appointment_date: string | null
  appointment_time: string | null
  offer_pv: boolean | null
  offer_storage: boolean | null
  offer_backup: boolean | null
  tvp: boolean | null
  documentation: string | null
  doc_link: string | null
  calendar_link: string | null
  follow_up: boolean | null
  follow_up_date: string | null
  exported_to_sap: boolean | null
  lat: number | null
  lng: number | null
}

export interface CreateLeadData {
  name?: string
  phone?: string
  email?: string
  address?: string
  status_since?: string
  lead_status?: string
  contact_type?: string
  phone_status?: string
  appointment_date?: string
  appointment_time?: string
  offer_pv?: boolean
  offer_storage?: boolean
  offer_backup?: boolean
  tvp?: boolean
  documentation?: string
  doc_link?: string
  calendar_link?: string
  follow_up?: boolean
  follow_up_date?: string
  exported_to_sap?: boolean
  lat?: number
  lng?: number
}

export interface UpdateLeadData extends CreateLeadData {
  id: string
} 