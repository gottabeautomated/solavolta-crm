export interface StatusChange {
  id: string
  lead_id: string
  old_status: string | null
  new_status: string
  changed_by: string
  changed_at: string
  reason?: string
  notes?: string
}

export interface StatusRule {
  id: string
  name: string
  trigger_condition: string
  action: string
  parameters?: Record<string, any>
  enabled: boolean
}

export interface Notification {
  id: string
  user_id: string
  lead_id?: string
  type: 'status_change' | 'follow_up' | 'appointment' | 'system'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
}

export interface StatusStatistics {
  total_leads: number
  by_status: Record<string, number>
  by_contact_type: Record<string, number>
  recent_activity: StatusChange[]
  pending_follow_ups: number
  upcoming_appointments: number
} 