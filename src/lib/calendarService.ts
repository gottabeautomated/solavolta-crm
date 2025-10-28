/**
 * Kalender-Service für Google Calendar Integration
 * Erstellt Termine und versendet automatische Einladungen an Kunden
 */

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: {
    dateTime: string // ISO 8601
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  conferenceData?: {
    createRequest?: {
      requestId: string
      conferenceSolutionKey: {
        type: 'hangoutsMeet'
      }
    }
  }
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface CreateAppointmentRequest {
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

export interface CreateAppointmentResponse {
  success: boolean
  appointmentId?: string
  calendarEventId?: string
  calendarLink?: string
  meetingLink?: string
  error?: string
}

export class CalendarService {
  private readonly webhookUrl: string
  private readonly timeZone: string

  constructor(webhookUrl?: string, timeZone: string = 'Europe/Berlin') {
    const envUrl = (import.meta as any)?.env?.VITE_CALENDAR_WEBHOOK_URL as string | undefined
    this.webhookUrl = webhookUrl || envUrl || 'https://n8n.beautomated.at/webhook/calendar-appointment'
    this.timeZone = timeZone
  }

  /**
   * Erstellt einen Termin mit automatischer Kalendereinladung
   */
  async createAppointmentWithInvite(request: CreateAppointmentRequest): Promise<CreateAppointmentResponse> {
    try {
      // Validierung
      if (!request.customerEmail) {
        throw new Error('Kunden-E-Mail ist erforderlich für Kalendereinladungen')
      }

      if (!this.isValidEmail(request.customerEmail)) {
        throw new Error('Ungültige E-Mail-Adresse')
      }

      // Zeitberechnung
      const startDateTime = this.combineDateTime(request.appointmentDate, request.appointmentTime)
      const endDateTime = this.addMinutes(startDateTime, request.durationMinutes || 60)

      // Webhook-Payload
      const payload = {
        leadId: request.leadId,
        tenantId: request.tenantId,
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        timeZone: this.timeZone,
        durationMinutes: request.durationMinutes || 60,
        meetingType: request.meetingType,
        location: request.location,
        notes: request.notes,
        sendInvite: request.sendInvite !== false, // Default: true
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result as CreateAppointmentResponse
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Termins',
      }
    }
  }

  /**
   * Erstellt ein Google Calendar Event Objekt
   */
  createCalendarEvent(
    summary: string,
    startDateTime: Date,
    endDateTime: Date,
    attendeeEmail: string,
    attendeeName: string,
    options?: {
      location?: string
      description?: string
      createMeetLink?: boolean
      reminders?: Array<{ method: 'email' | 'popup'; minutes: number }>
    }
  ): CalendarEvent {
    const event: CalendarEvent = {
      summary,
      description: options?.description,
      location: options?.location,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: this.timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: this.timeZone,
      },
      attendees: [
        {
          email: attendeeEmail,
          displayName: attendeeName,
          responseStatus: 'needsAction',
        },
      ],
      reminders: {
        useDefault: false,
        overrides: options?.reminders || [
          { method: 'email', minutes: 24 * 60 }, // 24h vorher
          { method: 'popup', minutes: 60 }, // 1h vorher
        ],
      },
    }

    // Google Meet Link erstellen
    if (options?.createMeetLink) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      }
    }

    return event
  }

  /**
   * Sendet eine Terminerinnerung
   */
  async sendReminder(appointmentId: string, customerEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      const reminderUrl =
        (import.meta as any)?.env?.VITE_REMINDER_WEBHOOK_URL ||
        'https://n8n.beautomated.at/webhook/appointment-reminder'

      const response = await fetch(reminderUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, customerEmail }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Versenden der Erinnerung',
      }
    }
  }

  /**
   * Storniert einen Termin
   */
  async cancelAppointment(
    appointmentId: string,
    calendarEventId: string,
    customerEmail: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cancelUrl =
        (import.meta as any)?.env?.VITE_CANCEL_APPOINTMENT_WEBHOOK_URL ||
        'https://n8n.beautomated.at/webhook/cancel-appointment'

      const response = await fetch(cancelUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          calendarEventId,
          customerEmail,
          reason,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Stornieren des Termins',
      }
    }
  }

  // Helper-Funktionen

  private combineDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}:00`)
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000)
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Generiert Zeitslots für Terminauswahl
   */
  generateTimeSlots(startHour: number = 8, endHour: number = 18, intervalMinutes: number = 30): string[] {
    const slots: string[] = []
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const hourStr = hour.toString().padStart(2, '0')
        const minuteStr = minute.toString().padStart(2, '0')
        slots.push(`${hourStr}:${minuteStr}`)
      }
    }
    return slots
  }

  /**
   * Formatiert Datum für Anzeige
   */
  formatDateTime(isoString: string, locale: string = 'de-DE'): string {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date)
  }
}

export const calendarService = new CalendarService()

