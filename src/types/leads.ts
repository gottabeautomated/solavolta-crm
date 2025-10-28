import type { Database } from './database.types'

export interface OfferData {
  type: 'pv' | 'storage' | 'emergency' | 'tvp';
  date?: string;
  number?: string;
  bucket?: string;
  storage_path?: string;
  amount?: number;
}

export type Lead = Database['public']['Tables']['leads']['Row'] & {
  // Frontend-Präzisierung: JSON-Feld als strukturierte Liste behandeln
  offers: OfferData[] | null
}
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type LeadStatus = 
  | 'Neu'
  | 'Kontaktiert'
  | 'In Bearbeitung'
  | 'Termin vereinbart'
  | 'Angebot übermittelt'
  | 'In Überlegung'
  | 'TVP'
  | 'Gewonnen'
  | 'Verloren'
  | 'Nicht erreicht 1x'
  | 'Nicht erreicht 2x'
  | 'Nicht erreicht 3x';

export type LostReason = 
  | 'andere_firma'
  | 'pv_pausiert'
  | 'kein_interesse'
  | 'termin_abgesagt'
  | 'angebot_abgelehnt';

export const CONTACT_TYPE_OPTIONS = [
  { value: 'Telefon', label: 'Telefon' },
  { value: 'Vor Ort', label: 'Vor Ort' },
  { value: 'E-Mail', label: 'E-Mail' },
];

export const LEAD_STATUS_OPTIONS = [
  { value: 'Neu', label: 'Neu' },
  { value: 'Kontaktiert', label: 'Kontaktiert' },
  { value: 'In Bearbeitung', label: 'In Bearbeitung' },
  { value: 'Termin vereinbart', label: 'Termin vereinbart' },
  { value: 'Angebot übermittelt', label: 'Angebot übermittelt' },
  { value: 'In Überlegung', label: 'In Überlegung' },
  { value: 'TVP', label: 'TVP' },
  { value: 'Gewonnen', label: 'Gewonnen' },
  { value: 'Verloren', label: 'Verloren' },
  { value: 'Nicht erreicht 1x', label: 'Nicht erreicht 1x' },
  { value: 'Nicht erreicht 2x', label: 'Nicht erreicht 2x' },
  { value: 'Nicht erreicht 3x', label: 'Nicht erreicht 3x' },
];

export const ARCHIVE_FILTER_OPTIONS = [
  { value: 'exclude_archived', label: 'Ohne Archivierte (Standard)' },
  { value: 'only_archived', label: 'Nur Archivierte' },
  { value: 'include_archived', label: 'Archivierte einblenden' },
];

export const LOST_REASON_OPTIONS = [
  { value: 'andere_firma', label: 'Andere Firma' },
  { value: 'pv_pausiert', label: 'PV pausiert' },
  { value: 'kein_interesse', label: 'Kein Interesse' },
  { value: 'termin_abgesagt', label: 'Termin abgesagt' },
  { value: 'angebot_abgelehnt', label: 'Angebot abgelehnt' },
];

export const PHONE_STATUS_OPTIONS = [
  { value: 'erreichbar', label: 'Erreicht' },
  { value: 'nicht_erreichbar', label: 'Nicht erreicht' },
  { value: 'zurueckrufen', label: 'Rückruf erbeten' },
  { value: 'termin_vereinbart', label: 'Termin vereinbart' },
];

// OfferData wurde nach oben verschoben, damit Lead es erweitern kann

export type ContactType = 'Telefon' | 'Vor Ort' | 'E-Mail'
export type PhoneStatus = 'erreichbar' | 'nicht_erreichbar' | 'zurueckrufen' | 'termin_vereinbart'

export type CreateLeadInput = Omit<LeadInsert, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'user_id'>;
export type UpdateLeadInput = Omit<LeadUpdate, 'updated_at'> & { id: string };

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Filter-Typen für Lead-Listen/Komponenten
export type LeadFilters = {
  search?: string
  status?: LeadStatus | null
  follow_up?: boolean
  exported_to_sap?: boolean
  contact_type?: ContactType | null
  phone_status?: PhoneStatus | null
  archivedMode?: 'exclude_archived' | 'only_archived' | 'include_archived'
}
