import type { Lead, LeadStatus } from '../types/leads';

export const getAvailableStatuses = (lead: Lead): LeadStatus[] => {
  const baseStatuses: LeadStatus[] = ['Neu', 'Kontaktiert'];
  
  // Status basierend auf aktuellem Zustand filtern
  switch(lead.lead_status) {
    case 'Neu':
      return [...baseStatuses, 'Verloren'];
      
    case 'Kontaktiert':
      return [...baseStatuses, 'Termin vereinbart', 'Angebot übermittelt', 'Verloren'];
      
    case 'Termin vereinbart':
    case 'Angebot übermittelt':
      return [...baseStatuses, 'Termin vereinbart', 'Angebot übermittelt', 'In Überlegung', 'Verloren'];
      
    case 'In Überlegung':
      return [...baseStatuses, 'Termin vereinbart', 'Angebot übermittelt', 'In Überlegung', 'TVP', 'Verloren'];
      
    case 'TVP':
      return [...baseStatuses, 'Termin vereinbart', 'Angebot übermittelt', 'In Überlegung', 'TVP', 'Gewonnen', 'Verloren'];
      
    default:
      return baseStatuses;
  }
};

export const isStatusAutoManaged = (lead: Lead): boolean => {
  return lead.offer_pv || lead.tvp;
};

export const getStatusLabel = (status: LeadStatus): string => {
  const labels: Record<LeadStatus, string> = {
    'Neu': 'Neu',
    'Kontaktiert': 'Kontaktiert',
    'Termin vereinbart': 'Termin vereinbart',
    'Angebot übermittelt': 'Angebot übermittelt',
    'In Überlegung': 'In Überlegung',
    'TVP': 'TVP',
    'Gewonnen': 'Gewonnen',
    'Verloren': 'Verloren'
  };
  return labels[status] || status;
};

// Phase 1: Status-Normalisierung und Kontaktierbarkeit
export function normalizeStatus(status: unknown): string {
  if (typeof status !== 'string') return ''
  return status.toLowerCase().trim().replace(/\s+/g, ' ')
}

export const CONTACTABLE_STATUSES = new Set([
  'neu',
  'nicht erreicht',
  'nicht erreicht 1x',
  'nicht erreicht 2x',
  'nicht erreicht 3x',
  'zu kontaktieren'
])

export function isContactableByStatus(lead: Pick<Lead, 'lead_status'> | { lead_status?: any }): boolean {
  const s = normalizeStatus((lead as any)?.lead_status)
  if (!s) return false
  // „nicht erreicht“ ohne Zähler ebenso zulassen
  if (s.startsWith('nicht erreicht')) return true
  return CONTACTABLE_STATUSES.has(s)
}

// Strengerer Ableitungs-Filter für "Heute kontaktieren" (Status-basiert, ohne RLS-Abfrage)
// - nur "neu" oder "nicht erreicht*"
// - keine archivierten Leads
// - keine "verloren"
export function isDerivedContactCandidate(lead: Partial<Lead> & { lead_status?: any }): boolean {
  const s = normalizeStatus(lead?.lead_status)
  if (!(s === 'neu' || s.startsWith('nicht erreicht'))) return false
  if (normalizeStatus(lead?.lead_status) === 'verloren') return false
  if ((lead as any)?.archived === true) return false
  return true
}