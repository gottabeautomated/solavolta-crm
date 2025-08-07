import type { Lead, PhoneStatus, LeadStatus } from '../../types/leads'

export interface StatusRule {
  condition: (lead: Lead) => boolean
  action: (lead: Lead) => Partial<Lead>
  priority: number
  description: string
}

export const STATUS_RULES: StatusRule[] = [
  // Automatischer Lead-Status basierend auf Telefonstatus
  {
    condition: (lead) => lead.phone_status === 'erreicht' && lead.lead_status === 'Neu',
    action: (lead) => ({ lead_status: 'Offen' as LeadStatus }),
    priority: 1,
    description: 'Lead-Status auf "Offen" setzen wenn Kunde erreicht wurde'
  },
  
  {
    condition: (lead) => lead.phone_status === 'nicht verfügbar' && lead.lead_status !== 'Verloren',
    action: (lead) => ({ lead_status: 'Verloren' as LeadStatus }),
    priority: 2,
    description: 'Lead-Status auf "Verloren" setzen wenn Kunde nicht verfügbar'
  },
  
  // Automatische Follow-up Generierung
  {
    condition: (lead) => 
      (lead.phone_status === 'keine Antwort' || lead.phone_status === 'besetzt') && 
      !lead.follow_up,
    action: (lead) => ({ 
      follow_up: true,
      follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +7 Tage
    }),
    priority: 3,
    description: 'Automatisches Follow-up für nicht erreichbare Kunden'
  },
  
  // Termin-Überwachung
  {
    condition: (lead) => 
      lead.appointment_date && 
      new Date(lead.appointment_date) < new Date() &&
      lead.lead_status !== 'Gewonnen' && lead.lead_status !== 'Verloren',
    action: (lead) => ({ 
      lead_status: 'Offen' as LeadStatus,
      documentation: `${lead.documentation || ''}\n\n[${new Date().toISOString()}] Termin verpasst - Follow-up erforderlich`
    }),
    priority: 4,
    description: 'Lead-Status nach verpasstem Termin auf "Offen" setzen'
  }
]

export function applyStatusRules(lead: Lead): Partial<Lead> {
  const applicableRules = STATUS_RULES
    .filter(rule => rule.condition(lead))
    .sort((a, b) => a.priority - b.priority)
  
  const updates: Partial<Lead> = {}
  
  for (const rule of applicableRules) {
    const ruleUpdates = rule.action(lead)
    Object.assign(updates, ruleUpdates)
  }
  
  return updates
}

export function shouldNotifyStatusChange(oldLead: Lead, newLead: Lead): boolean {
  // Benachrichtigung bei wichtigen Status-Änderungen
  const importantChanges = [
    oldLead.lead_status !== newLead.lead_status,
    oldLead.phone_status !== newLead.phone_status,
    !oldLead.follow_up && newLead.follow_up,
    oldLead.appointment_date !== newLead.appointment_date
  ]
  
  return importantChanges.some(change => change)
} 