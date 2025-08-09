import type { Lead } from '../types/leads'

export interface FollowupReminder {
  id: string
  lead_id: string
  follow_up_date: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  days_overdue: number
  lead_name: string
  lead_phone: string
  lead_status: string
}

export interface FollowupStats {
  total: number
  overdue: number
  today: number
  this_week: number
  next_week: number
  by_priority: Record<'critical' | 'high' | 'medium' | 'low', number>
}

export class FollowupService {
  private readonly webhookUrl: string

  constructor(webhookUrl?: string) {
    const envUrl = (import.meta as any)?.env?.VITE_FOLLOWUP_WEBHOOK_URL as string | undefined
    this.webhookUrl = webhookUrl || envUrl || 'http://localhost:5678/webhook/followup-reminder'
  }

  public calculatePriority(followUpDate: string): {
    priority: 'low' | 'medium' | 'high' | 'critical'
    daysOverdue: number
  } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const followUp = new Date(followUpDate)
    followUp.setHours(0, 0, 0, 0)

    const daysOverdue = Math.floor((today.getTime() - followUp.getTime()) / (1000 * 60 * 60 * 24))

    let priority: 'low' | 'medium' | 'high' | 'critical'

    if (daysOverdue > 14) {
      priority = 'critical'
    } else if (daysOverdue > 7) {
      priority = 'high'
    } else if (daysOverdue > 0) {
      priority = 'medium'
    } else {
      priority = 'low'
    }

    return { priority, daysOverdue }
  }

  public processLeadsForFollowup(leads: Lead[]): FollowupReminder[] {
    return (leads || [])
      .filter((lead) => lead.follow_up && !!lead.follow_up_date)
      .map((lead) => {
        const { priority, daysOverdue } = this.calculatePriority(lead.follow_up_date as string)

        return {
          id: `followup-${lead.id}`,
          lead_id: lead.id,
          follow_up_date: lead.follow_up_date as string,
          priority,
          days_overdue: daysOverdue,
          lead_name: lead.name || 'Unbekannt',
          lead_phone: lead.phone || '',
          lead_status: lead.lead_status || 'Unbekannt',
        }
      })
      .sort((a, b) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1 } as const
        if (order[a.priority] !== order[b.priority]) {
          return order[b.priority] - order[a.priority]
        }
        return new Date(a.follow_up_date).getTime() - new Date(b.follow_up_date).getTime()
      })
  }

  public calculateStats(reminders: FollowupReminder[]): FollowupStats {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const stats: FollowupStats = {
      total: reminders.length,
      overdue: 0,
      today: 0,
      this_week: 0,
      next_week: 0,
      by_priority: { critical: 0, high: 0, medium: 0, low: 0 },
    }

    for (const reminder of reminders) {
      const followUpDate = new Date(reminder.follow_up_date)
      followUpDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor((today.getTime() - followUpDate.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff > 0) stats.overdue += 1
      if (daysDiff === 0) stats.today += 1
      if (daysDiff >= -7 && daysDiff <= 0) stats.this_week += 1
      if (daysDiff >= -14 && daysDiff < -7) stats.next_week += 1

      stats.by_priority[reminder.priority] += 1
    }

    return stats
  }

  public async triggerFollowupCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.webhookUrl}/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      return response.ok
    } catch (error) {
      console.error('Failed to trigger follow-up check:', error)
      return false
    }
  }
}

export const followupService = new FollowupService()


