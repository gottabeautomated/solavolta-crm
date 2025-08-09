export interface AppointmentRequest {
  lead_id: string
  appointment_date: string // YYYY-MM-DD
  appointment_time: string // HH:MM
  notes?: string
}

export interface AppointmentResponse {
  success: boolean
  message?: string
  appointment?: {
    calendar_event_id: string
    calendar_link: string
    lead_id: string
  }
  error?: string
}

export class AppointmentService {
  private readonly webhookUrl: string

  constructor(webhookUrl?: string) {
    const envUrl = (import.meta as any)?.env?.VITE_APPOINTMENT_WEBHOOK_URL as string | undefined
    this.webhookUrl = webhookUrl || envUrl || 'https://n8n.beautomated.at/webhook/create-appointment'
  }

  async createAppointment(appointmentData: AppointmentRequest): Promise<AppointmentResponse> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return (await response.json()) as AppointmentResponse
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
      }
    }
  }

  generateTimeSlots(startHour: number = 8, endHour: number = 18): string[] {
    const slots: string[] = []
    for (let hour = startHour; hour < endHour; hour++) {
      const hourStr = hour.toString().padStart(2, '0')
      slots.push(`${hourStr}:00`)
      slots.push(`${hourStr}:30`)
    }
    return slots
  }

  isValidAppointmentDate(date: string): boolean {
    const appointmentDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return appointmentDate >= today
  }

  isValidTimeSlot(time: string): boolean {
    const [hours] = time.split(':').map(Number)
    return hours >= 8 && hours < 18
  }
}

export const appointmentService = new AppointmentService()


