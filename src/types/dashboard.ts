// Shared primitives / utilities
export type DbUUID = string
export type Timestamp = string
export type ISODate = string
export type Nullable<T> = T | null
export type WithTenant<T> = T & { tenantId: DbUUID }

// Domain unions
export type TaskType = 'efu' | 'appointment'
export type FollowUpPriority = 'low' | 'medium' | 'high' | 'overdue'

// Base types
export interface BaseEntity {
  id: DbUUID
  tenantId: DbUUID
  createdAt?: Timestamp
}

export interface BaseTask {
  taskId: DbUUID
  source: TaskType
  leadId: DbUUID
  tenantId: DbUUID
  title: string
  dueAt: Timestamp
  priority: FollowUpPriority | string
  notes?: Nullable<string>
}

// App-level task types
export type TodayTask = BaseTask
export type OverdueTask = BaseTask

// Week overview (app-level)
export interface WeekOverview {
  dayDate: ISODate
  efuCount: number
  appointmentCount: number
}

// Lead row for dashboard lists
export interface LeadDashboardRow {
  leadId: DbUUID
  tenantId: DbUUID
  name: string
  phone: Nullable<string>
  email: Nullable<string>
  topPriority: FollowUpPriority | string
  nextDue: Nullable<ISODate>
}

// Aggregated dashboard payload
export interface DashboardData {
  today: TodayTask[]
  overdue: OverdueTask[]
  week: WeekOverview[]
  priorities: LeadDashboardRow[]
}

// API shapes (snake_case) from SQL functions
export type DashboardTaskSource = TaskType
export interface DashboardTask {
  task_id: DbUUID
  source: DashboardTaskSource
  lead_id: DbUUID
  tenant_id: DbUUID
  title: string
  due_at: Timestamp
  priority: FollowUpPriority | string
  notes: Nullable<string>
}

export interface WeekOverviewRow {
  day_date: ISODate
  efu_count: number
  appointment_count: number
}

export interface LeadPriorityRow {
  lead_id: DbUUID
  tenant_id: DbUUID
  name: string
  phone: Nullable<string>
  email: Nullable<string>
  top_priority: FollowUpPriority | string
  next_due: Nullable<ISODate>
}

// API response helpers for Supabase RPC
export interface RpcArrayResponse<T> {
  data: T[] | null
  error: Error | null
}

export interface RpcSingleResponse<T> {
  data: T | null
  error: Error | null
}

// Re-exports for EnhancedFollowUp domain
export type { EnhancedFollowUp, EnhancedFollowUpPriority } from './status'



