import type { SalesLeadStatus, EFURule } from '../types/sales'
import { calculateWorkingDays } from './dateUtils'

export const SALES_AUTOMATION_RULES: EFURule[] = [
  { id: 'first_contact_sla', trigger: { status: 'Neu' }, action: { type: 'create_efu', efu: { title: 'Erstkontakt', description: 'Erstkontakt innerhalb 24h durchführen (SLA)', days: 0, priority: 'high', type: 'call' } } },
  { id: 'qualified_follow_up', trigger: { status: 'Qualifiziert' }, action: { type: 'create_efu', efu: { title: 'Qualifizierten Lead kontaktieren', description: 'Kontaktaufnahme mit qualifiziertem Lead', days: 0, priority: 'high', type: 'call' } } },
  { id: 'not_reached_1x', trigger: { status: 'Nicht erreicht 1x' }, action: { type: 'create_efu', efu: { title: 'Kontaktversuch #2', description: 'Zweiter Kontaktversuch (+1 Arbeitstag)', days: 1, priority: 'medium', type: 'call' } } },
  { id: 'not_reached_2x', trigger: { status: 'Nicht erreicht 2x' }, action: { type: 'create_efu', efu: { title: 'Kontaktversuch #3', description: 'Dritter und letzter Kontaktversuch (+6 Arbeitstage)', days: 6, priority: 'medium', type: 'call' } } },
  { id: 'not_reached_3x', trigger: { status: 'Nicht erreicht 3x' }, action: { type: 'both', efu: { title: 'Follow-up nach Auto-E-Mail', description: 'Follow-up nach automatischer E-Mail-Kontaktaufnahme (+10 Arbeitstage)', days: 10, priority: 'low', type: 'custom' }, webhook: { endpoint: '/webhook/third-attempt-email', payload: { trigger: 'automated_email', template: 'not_reached_3x', priority: 'medium' } } } },
  { id: 'appointment_scheduled', trigger: { status: 'Termin vereinbart' }, action: { type: 'both', efu: { title: 'Termin-Reminder', description: 'Reminder 1 Tag vor Termin', days: -1, priority: 'medium', type: 'meeting' }, webhook: { endpoint: '/webhook/calendar-integration', payload: { trigger: 'appointment_scheduled', action: 'create_calendar_entry' } } } },
  { id: 'offer_requested', trigger: { status: 'Angebot angefragt' }, action: { type: 'create_efu', efu: { title: 'Angebot erstellen', description: 'Angebot erstellen und versenden (SLA: 2 Tage)', days: 2, priority: 'high', type: 'offer_followup' } } },
  { id: 'offer_created', trigger: { status: 'Angebot erstellt' }, action: { type: 'create_efu', efu: { title: 'Angebot nachfassen #1', description: 'Erstes Angebots-Follow-up (SLA: 3 Tage)', days: 3, priority: 'medium', type: 'offer_followup' } } },
  { id: 'negotiation_followup', trigger: { status: 'Verhandlung' }, action: { type: 'create_efu', efu: { title: 'Finales Follow-up', description: 'Finale Verhandlungsrunde', days: 5, priority: 'high', type: 'call' } } },
  { id: 'lead_won', trigger: { status: 'Gewonnen' }, action: { type: 'webhook', webhook: { endpoint: '/webhook/project-handover', payload: { trigger: 'lead_won', action: 'create_project', priority: 'high' } } } },
  { id: 'lead_lost', trigger: { status: 'Verloren' }, action: { type: 'create_efu', efu: { title: 'Revival-Kontakt', description: 'Revival-Kontakt nach 30 Tagen', days: 30, priority: 'low', type: 'call' } } },
  { id: 'lead_paused', trigger: { status: 'Pausiert', conditions: { has_resume_date: true } }, action: { type: 'create_efu', efu: { title: 'Pausierte Lead wieder aufnehmen', description: 'Lead nach Pausierung wieder kontaktieren', days: 0, priority: 'medium', type: 'call' } } },
]

export interface SLADefinition { name: string; status: SalesLeadStatus[]; target_hours: number; priority: 'low' | 'medium' | 'high' | 'urgent'; description: string }

export const SLA_DEFINITIONS: SLADefinition[] = [
  { name: 'Erstkontakt', status: ['Neu', 'Qualifiziert'], target_hours: 24, priority: 'high', description: 'Erstkontakt innerhalb 24 Stunden' },
  { name: 'Angebotserstellung', status: ['Angebot angefragt'], target_hours: 48, priority: 'high', description: 'Angebot innerhalb 2 Arbeitstagen erstellen' },
  { name: 'Angebots-Follow-up', status: ['Angebot erstellt'], target_hours: 72, priority: 'medium', description: 'Angebot innerhalb 3 Arbeitstagen nachfassen' },
  { name: 'Kontakt-Kaskade', status: ['Nicht erreicht 1x', 'Nicht erreicht 2x', 'Nicht erreicht 3x'], target_hours: 336, priority: 'medium', description: 'Komplette Kontakt-Kaskade innerhalb 14 Tagen' },
]

export function getRuleForStatus(status: SalesLeadStatus, conditions?: Record<string, any>): EFURule | null {
  return SALES_AUTOMATION_RULES.find(rule => {
    if (rule.trigger.status !== status) return false
    if (rule.trigger.conditions && conditions) {
      return Object.entries(rule.trigger.conditions).every(([key, value]) => checkCondition(key, value, conditions))
    }
    return !rule.trigger.conditions
  }) || null
}

export function checkCondition(key: string, expectedValue: any, data: Record<string, any>): boolean {
  switch (key) {
    case 'has_resume_date':
      return expectedValue ? !!data.paused_until : !data.paused_until
    case 'has_first_followup':
      return expectedValue ? !!data.has_first_followup : !data.has_first_followup
    default:
      return data[key] === expectedValue
  }
}

export function getSLAForStatus(status: SalesLeadStatus): SLADefinition | null {
  return SLA_DEFINITIONS.find(sla => sla.status.includes(status)) || null
}

export function calculateSLADeadline(leadUpdatedAtISO: string, slaHours: number): Date {
  const base = new Date(leadUpdatedAtISO)
  return new Date(base.getTime() + slaHours * 3600 * 1000)
}

export function isSLABreached(leadUpdatedAtISO: string, slaHours: number, now: Date = new Date()): boolean {
  return now > calculateSLADeadline(leadUpdatedAtISO, slaHours)
}

export function buildWebhookURL(endpoint: string, baseUrl?: string): string {
  const base = baseUrl || (import.meta as any)?.env?.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
  return `${base}${endpoint}`
}

export function calculateEFUDateForStatus(status: SalesLeadStatus, baseDate: Date = new Date(), data?: Record<string, any>): Date {
  const rule = getRuleForStatus(status, data)
  if (!rule || !rule.action.efu) return baseDate
  const days = rule.action.efu.days
  if (status === 'Termin vereinbart' && data?.appointment_date) {
    const appointmentDate = new Date(data.appointment_date)
    return calculateWorkingDays(appointmentDate, -1)
  }
  if (status === 'Pausiert' && data?.paused_until) {
    return new Date(data.paused_until)
  }
  return calculateWorkingDays(baseDate, days)
}



