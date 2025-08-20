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
