// ===================================================================
// TYPES - SALES AUTOMATION (erweiterte Sales-Typen getrennt von Basis-Lead)
// ===================================================================

// Erweiterte Status-Definition für professionellen Sales-Cycle
export type SalesLeadStatus = 
  | 'Neu'
  | 'Qualifiziert'
  | 'Nicht erreicht 1x'
  | 'Nicht erreicht 2x'
  | 'Nicht erreicht 3x'
  | 'In Bearbeitung'
  | 'Termin vereinbart'
  | 'Angebot angefragt'
  | 'Angebot erstellt'
  | 'Verhandlung'
  | 'Gewonnen'
  | 'Verloren'
  | 'Pausiert'
  | 'Dublette'

export type SalesLossReason = 
  | 'Kein Interesse'
  | 'Projekt pausiert'
  | 'Andere Firma gewählt'
  | 'Budget nicht verfügbar'
  | 'Nicht erreicht nach 3x'
  | 'Wettbewerber günstiger'
  | 'Zu lange Wartezeit'
  | 'Technische Bedenken'
  | 'Sonstiges'

export type AppointmentChannel = 'telefon' | 'vor_ort' | 'online'
export type SLAStatus = 'OK' | 'ACTIVE' | 'BREACH'

export interface SalesMetric {
  id: string
  tenant_id: string
  lead_id: string
  metric_type: 'status_change' | 'won' | 'lost' | 'offer_created' | 'sla_breach' | 'first_contact'
  metric_value: number
  metric_date: string
  additional_data?: Record<string, any>
  created_at: string
}

// Erweiterte Lead-Definition für Sales-Kontext (separat, um Konflikte zu vermeiden)
export interface SalesLead {
  id: string
  tenant_id?: string
  user_id?: string
  name: string
  phone?: string
  email?: string
  address?: string
  lead_status: SalesLeadStatus
  status_since: string
  loss_reason?: SalesLossReason | string
  not_reached_count: number
  voicemail_left: boolean
  phone_switched_off: boolean
  appointment_date?: string
  appointment_time?: string
  appointment_channel?: AppointmentChannel
  appointment_completed?: boolean
  offer_created_at?: string
  offer_sent_at?: string
  offer_amount?: number
  offer_link?: string
  won_at?: string
  lost_competitor?: string
  paused_until?: string
  pause_reason?: string
  pv_kwp?: number
  storage_kwh?: number
  has_backup?: boolean
  has_ev_charger?: boolean
  has_heating_mgmt?: boolean
  quick_notes?: string
  follow_up: boolean
  follow_up_date?: string
  exported_to_sap: boolean
  created_at: string
  updated_at: string
  lat?: number
  lng?: number
}

export interface SLAOverview {
  id: string
  name: string
  lead_status: SalesLeadStatus
  created_at: string
  updated_at: string
  tenant_id: string
  first_contact_sla: SLAStatus
  offer_creation_sla: SLAStatus
  offer_followup_sla: SLAStatus
}

export interface SalesKPIs {
  new_leads: number
  won_leads: number
  lost_leads: number
  offers_out: number
  in_contact_phase: number
  conversion_rate: number
  offer_rate: number
  sla_breaches: number
  avg_hours_to_close: number
  avg_hours_to_offer: number
  days_analyzed: number
}

export interface EFURule {
  id: string
  trigger: {
    status: SalesLeadStatus
    conditions?: Record<string, any>
  }
  action: {
    type: 'create_efu' | 'webhook' | 'both'
    efu?: {
      title: string
      description: string
      days: number
      priority: 'low' | 'medium' | 'high' | 'urgent'
      type: string
    }
    webhook?: {
      endpoint: string
      payload: Record<string, any>
    }
  }
}

export const SALES_LEAD_STATUS_OPTIONS: { value: SalesLeadStatus; label: string; color: string; icon: string }[] = [
  { value: 'Neu', label: 'Neu', color: 'blue', icon: '🆕' },
  { value: 'Qualifiziert', label: 'Qualifiziert', color: 'indigo', icon: '✅' },
  { value: 'Nicht erreicht 1x', label: 'Nicht erreicht (1x)', color: 'yellow', icon: '📞' },
  { value: 'Nicht erreicht 2x', label: 'Nicht erreicht (2x)', color: 'orange', icon: '📞' },
  { value: 'Nicht erreicht 3x', label: 'Nicht erreicht (3x)', color: 'red', icon: '📞' },
  { value: 'In Bearbeitung', label: 'In Bearbeitung', color: 'purple', icon: '⚙️' },
  { value: 'Termin vereinbart', label: 'Termin vereinbart', color: 'green', icon: '📅' },
  { value: 'Angebot angefragt', label: 'Angebot angefragt', color: 'blue', icon: '📄' },
  { value: 'Angebot erstellt', label: 'Angebot erstellt', color: 'indigo', icon: '📋' },
  { value: 'Verhandlung', label: 'Verhandlung', color: 'purple', icon: '🤝' },
  { value: 'Gewonnen', label: 'Gewonnen', color: 'green', icon: '🎉' },
  { value: 'Verloren', label: 'Verloren', color: 'red', icon: '❌' },
  { value: 'Pausiert', label: 'Pausiert', color: 'gray', icon: '⏸️' },
  { value: 'Dublette', label: 'Dublette', color: 'gray', icon: '🔄' }
]

export const LOSS_REASON_OPTIONS_SALES: { value: SalesLossReason; label: string }[] = [
  { value: 'Kein Interesse', label: 'Kein Interesse' },
  { value: 'Projekt pausiert', label: 'Projekt pausiert' },
  { value: 'Andere Firma gewählt', label: 'Andere Firma gewählt' },
  { value: 'Budget nicht verfügbar', label: 'Budget nicht verfügbar' },
  { value: 'Nicht erreicht nach 3x', label: 'Nicht erreicht nach 3 Versuchen' },
  { value: 'Wettbewerber günstiger', label: 'Wettbewerber günstiger' },
  { value: 'Zu lange Wartezeit', label: 'Zu lange Wartezeit' },
  { value: 'Technische Bedenken', label: 'Technische Bedenken' },
  { value: 'Sonstiges', label: 'Sonstiges' }
]

export const APPOINTMENT_CHANNEL_OPTIONS: { value: AppointmentChannel; label: string; icon: string }[] = [
  { value: 'telefon', label: 'Telefon', icon: '📞' },
  { value: 'vor_ort', label: 'Vor Ort', icon: '🏠' },
  { value: 'online', label: 'Online (Video)', icon: '💻' }
]

export function getStatusInfo(status: SalesLeadStatus) {
  return SALES_LEAD_STATUS_OPTIONS.find(opt => opt.value === status) || {
    value: status,
    label: status,
    color: 'gray',
    icon: '❓'
  }
}

export function isStatusAutomationEligible(status: SalesLeadStatus): boolean {
  const automationStatuses: SalesLeadStatus[] = [
    'Neu',
    'Nicht erreicht 1x',
    'Nicht erreicht 2x', 
    'Nicht erreicht 3x',
    'Termin vereinbart',
    'Angebot angefragt',
    'Angebot erstellt',
    'Gewonnen',
    'Verloren',
    'Pausiert'
  ]
  return automationStatuses.includes(status)
}

export function getNextLogicalStatuses(currentStatus: SalesLeadStatus): SalesLeadStatus[] {
  const transitions: Record<SalesLeadStatus, SalesLeadStatus[]> = {
    'Neu': ['Qualifiziert', 'Nicht erreicht 1x', 'In Bearbeitung', 'Verloren'],
    'Qualifiziert': ['Nicht erreicht 1x', 'In Bearbeitung', 'Termin vereinbart', 'Verloren'],
    'Nicht erreicht 1x': ['Nicht erreicht 2x', 'In Bearbeitung', 'Verloren'],
    'Nicht erreicht 2x': ['Nicht erreicht 3x', 'In Bearbeitung', 'Verloren'],
    'Nicht erreicht 3x': ['In Bearbeitung', 'Verloren'],
    'In Bearbeitung': ['Termin vereinbart', 'Angebot angefragt', 'Gewonnen', 'Verloren', 'Pausiert'],
    'Termin vereinbart': ['Angebot angefragt', 'Gewonnen', 'Verloren', 'Pausiert'],
    'Angebot angefragt': ['Angebot erstellt', 'Verloren', 'Pausiert'],
    'Angebot erstellt': ['Verhandlung', 'Gewonnen', 'Verloren', 'Pausiert'],
    'Verhandlung': ['Gewonnen', 'Verloren', 'Pausiert'],
    'Gewonnen': [],
    'Verloren': ['Neu'],
    'Pausiert': ['Neu', 'In Bearbeitung', 'Termin vereinbart'],
    'Dublette': []
  }
  return transitions[currentStatus] || []
}

export function getEFUPriorityForStatus(status: SalesLeadStatus): 'low' | 'medium' | 'high' | 'urgent' {
  const priorityMap: Record<SalesLeadStatus, 'low' | 'medium' | 'high' | 'urgent'> = {
    'Neu': 'high',
    'Qualifiziert': 'high',
    'Nicht erreicht 1x': 'medium',
    'Nicht erreicht 2x': 'medium', 
    'Nicht erreicht 3x': 'low',
    'In Bearbeitung': 'medium',
    'Termin vereinbart': 'high',
    'Angebot angefragt': 'high',
    'Angebot erstellt': 'medium',
    'Verhandlung': 'high',
    'Gewonnen': 'low',
    'Verloren': 'low',
    'Pausiert': 'low',
    'Dublette': 'low'
  }
  return priorityMap[status] || 'medium'
}



