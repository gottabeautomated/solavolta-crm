/**
 * Type-Definitionen für Kalender-Automation
 */

export interface Appointment {
  id: string
  lead_id: string
  tenant_id: string
  starts_at: string
  duration_minutes: number
  meeting_type: 'vor_ort' | 'online' | 'telefon'
  location?: string
  meeting_link?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  calendar_event_id?: string
  calendar_provider?: 'google' | 'outlook' | 'apple'
  customer_email?: string
  customer_phone?: string
  invite_sent_at?: string
  invite_opened_at?: string
  invite_accepted_at?: string
  reminder_sent_at?: string
  created_at: string
  updated_at: string
}

export interface AppointmentWithLead extends Appointment {
  lead_name?: string
  lead_email?: string
  lead_phone?: string
  lead_address?: string
  lead_status?: string
}

export interface CreateAppointmentInput {
  leadId: string
  tenantId: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  appointmentDate: string // YYYY-MM-DD
  appointmentTime: string // HH:MM
  durationMinutes?: number
  meetingType: 'vor_ort' | 'online' | 'telefon'
  location?: string
  notes?: string
  sendInvite?: boolean
}

export interface AppointmentInviteStatus {
  sent: boolean
  sentAt?: string
  opened: boolean
  openedAt?: string
  accepted: boolean
  acceptedAt?: string
  reminderSent: boolean
  reminderSentAt?: string
}

export interface CalendarEventMetadata {
  eventId: string
  provider: 'google' | 'outlook' | 'apple'
  htmlLink?: string
  meetingLink?: string
  icsDownloadUrl?: string
}

