export interface Lead {
  id: string
  created_at: string
  updated_at?: string
  user_id?: string | null
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  status_since: string | null
  lead_status: LeadStatus | null
  contact_type: ContactType | null
  phone_status: PhoneStatus | null
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
  follow_up_time?: string | null
  exported_to_sap: boolean | null
  lat: number | null
  lng: number | null
  // virtueller Wert für UI, falls Appointments-Tabelle genutzt wird
  next_appointment_at?: string | null
  // Geocoding Felder (optional)
  geocoding_status?: string | null
  geocoding_error?: string | null
  geocoded_at?: string | null
  offers?: OfferData[]
  // Neue Felder für "Nächste Aktion"
  next_action?: string | null
  next_action_date?: string | null
  next_action_time?: string | null
  preliminary_offer?: boolean | null
  // Neues Feld für "Verloren" Grund
  lost_reason?: LostReason | null
}

export interface Appointment {
  id: string
  lead_id: string
  starts_at: string
  notes?: string | null
  calendar_link?: string | null
  external_event_id?: string | null
  status?: string | null
  created_at: string
}

// Enums für bessere Type Safety
export type LeadStatus = 'Neu' | 'Offen' | 'Verloren' | 'Gewonnen' | 'Erreicht'
export type ContactType = 'Telefon' | 'Vor Ort' | 'E-Mail'
export type PhoneStatus = 'erreicht' | 'keine Antwort' | 'besetzt' | 'nicht verfügbar'

// Neue Typen für "Verloren" Lead-Status
export type LostReason = 'kein_interesse' | 'andere_firma' | 'verschoben' | 'nicht_erreichbar'

// Offer Data Interface
export interface OfferData {
  type: 'pv' | 'storage' | 'emergency' | 'tvp'
  date: string
  number?: string
  file?: File
  fileName?: string
  // Sicheres Speichern: Pfad im privaten Storage + Bucket-Name
  storage_path?: string
  bucket?: 'offers' | 'tvp'
}

// Für Dropdown-Listen
export const LEAD_STATUS_OPTIONS: LeadStatus[] = ['Neu', 'Offen', 'Verloren', 'Gewonnen', 'Erreicht']
export const CONTACT_TYPE_OPTIONS: ContactType[] = ['Telefon', 'Vor Ort', 'E-Mail']
export const PHONE_STATUS_OPTIONS: PhoneStatus[] = ['erreicht', 'keine Antwort', 'besetzt', 'nicht verfügbar']

// Optionen für "Verloren" Gründe
export const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: 'kein_interesse', label: 'Kein Interesse mehr' },
  { value: 'andere_firma', label: 'Hat sich für eine andere Firma entschieden' },
  { value: 'verschoben', label: 'Projekt auf einen späteren Zeitpunkt verschoben' },
  { value: 'nicht_erreichbar', label: 'Kunde meldet sich nicht mehr' }
]

// Für neue Leads (ohne ID und Timestamps)
export type CreateLeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at'>

// Für Updates (alle Felder optional außer ID)
export type UpdateLeadInput = Partial<Omit<Lead, 'id' | 'created_at'>> & { id: string }

// Supabase Response Types
export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseListResponse<T> {
  data: T[] | null
  error: Error | null
  count?: number
}

// Filter Types für Lead-Liste
export interface LeadFilters {
  search?: string
  status?: LeadStatus
  follow_up?: boolean
  exported_to_sap?: boolean
  contact_type?: ContactType
  phone_status?: PhoneStatus
}

// Sort Options
export type LeadSortField = 'created_at' | 'name' | 'lead_status' | 'follow_up_date'
export type SortDirection = 'asc' | 'desc'

export interface LeadSortOptions {
  field: LeadSortField
  direction: SortDirection
}

// Legacy Types für Backwards Compatibility
export interface CreateLeadData extends CreateLeadInput {}
export interface UpdateLeadData extends UpdateLeadInput {} 