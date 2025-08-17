/* App Health Utilities
 * - Startup Health Check
 * - localStorage Validation & Cleanup
 * - Corrupted State Detection
 * - Automatic Recovery hooks (uses clearAppCaches from cacheBuster)
 */

import { clearAppCaches } from './cacheBuster'

export type HealthLevel = 'ok' | 'warning' | 'error'

export interface HealthIssue {
  level: HealthLevel
  code: string
  message: string
  fixed?: boolean
}

export interface HealthReport {
  ok: boolean
  issues: HealthIssue[]
  actions: string[]
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function validateLocalStorage(): { issues: HealthIssue[]; actions: string[] } {
  const issues: HealthIssue[] = []
  const actions: string[] = []
  try {
    const activeTenantId = localStorage.getItem('activeTenantId')
    if (activeTenantId && (activeTenantId.includes('<') || activeTenantId.includes('>'))) {
      issues.push({ level: 'warning', code: 'tenant_id_placeholder', message: 'activeTenantId enthält Platzhalter', fixed: true })
      localStorage.removeItem('activeTenantId')
      actions.push('Removed corrupted activeTenantId (angle brackets)')
    } else if (activeTenantId && !UUID_REGEX.test(activeTenantId)) {
      issues.push({ level: 'warning', code: 'tenant_id_invalid_uuid', message: 'activeTenantId ist kein gültiger UUID', fixed: true })
      localStorage.removeItem('activeTenantId')
      actions.push('Removed invalid UUID activeTenantId')
    }

    const authToken = Object.keys(localStorage).find(k => k.startsWith('sb-') || k.includes('supabase.auth.token'))
    if (!authToken) {
      issues.push({ level: 'warning', code: 'no_auth_token', message: 'Kein Supabase-Auth Token im localStorage' })
    }
  } catch (e) {
    issues.push({ level: 'error', code: 'localstorage_unavailable', message: 'localStorage nicht verfügbar' })
  }
  return { issues, actions }
}

export function detectCorruptedState(): { issues: HealthIssue[] } {
  const issues: HealthIssue[] = []
  // Env Vars
  const url = (import.meta as any)?.env?.VITE_SUPABASE_URL
  const key = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    issues.push({ level: 'error', code: 'missing_env', message: 'VITE_SUPABASE_URL oder VITE_SUPABASE_ANON_KEY fehlen' })
  }
  return { issues }
}

export async function startupHealthCheck(options?: { autoRecover?: boolean; devLogs?: boolean }): Promise<HealthReport> {
  const dev = !!(import.meta as any)?.env?.DEV
  const logs = !!options?.devLogs && dev
  const report: HealthReport = { ok: true, issues: [], actions: [] }

  const ls = validateLocalStorage()
  report.issues.push(...ls.issues)
  report.actions.push(...ls.actions)

  const cs = detectCorruptedState()
  report.issues.push(...cs.issues)

  // Wenn Supabase-Client bereits existiert, missinterpretierte ENV-Fehler entkräften
  try {
    if (typeof window !== 'undefined' && (window as any).supabase) {
      report.issues = report.issues.map(i => i.code === 'missing_env' ? { ...i, level: 'warning' as HealthLevel, message: i.message + ' (Supabase-Client vorhanden – downgraded)' } : i)
    }
  } catch {}

  // Bewertung
  if (report.issues.some(i => i.level === 'error')) report.ok = false

  if (!report.ok && options?.autoRecover) {
    if (logs) console.warn('[AppHealth] Critical state detected – clearing caches')
    try {
      await clearAppCaches({ clearAuth: false, reload: false, logDetails: dev })
      report.actions.push('clearAppCaches executed')
    } catch (e) {
      if (logs) console.error('[AppHealth] clearAppCaches failed', e)
    }
  }

  if (logs) console.log('[AppHealth] report', report)
  return report
}


