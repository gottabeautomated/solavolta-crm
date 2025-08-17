import React, { useCallback } from 'react'
import { useTodayTasks, useOverdueTasks, useWeekOverview, useDashboardRealtime } from '../hooks/useDashboardSWR'
import { supabase } from '../lib/supabase'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { Spinner } from './ui/LoadingStates'
import { Accordion } from './ui/Accordion'
import { KpiBar } from './KpiBar'
import { useDashboard } from '../contexts/DashboardContext'
import { useLeadIndex, extractZipFromAddress, normalize, fuzzyIncludes } from '../hooks/useLeadIndex'
import { SmartFilters } from './SmartFilters'
import { TaskListLite } from './TaskListLite'
import { registerKeyboardShortcuts } from '../lib/keyboardShortcuts'
import { ErrorBoundary } from './ui/ErrorBoundary'

interface Props {
  onOpenLead?: (leadId: string) => void
}

export function DashboardOverview({ onOpenLead }: Props) {
  useDashboardRealtime()
  const { items: overdue, loading: lO, error: eO, revalidate: rO } = useOverdueTasks()
  const { items: today, loading: lT, error: eT, revalidate: rT } = useTodayTasks()
  const { items: week, loading: lW, error: eW, revalidate: rW } = useWeekOverview()
  const { filters, setFilters } = useDashboard()
  const { byId: leadById } = useLeadIndex()
  const listRef = React.useRef<{ focusFirst: () => void; focusNext: () => void; focusPrev: () => void; toggleCurrent: () => void; openCurrent: () => void } | null>(null)

  const loading = lO || lT || lW
  const error = eO || eT || eW

  const refreshAll = useCallback(() => { rO(); rT(); rW() }, [rO, rT, rW])

  // Register keyboard shortcuts (must be declared before any conditional returns)
  React.useEffect(() => {
    const unregister = registerKeyboardShortcuts({
      goDashboard: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      goFollowups: () => {
        const btns = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[]
        const target = btns.find(b => /follow-ups/i.test(b.textContent || ''))
        target?.click()
      },
      focusSearch: () => document.getElementById('smart-search')?.focus(),
      nextTask: () => (window as any).__taskListLite?.focusNext?.(),
      prevTask: () => (window as any).__taskListLite?.focusPrev?.(),
      toggleSelect: () => (window as any).__taskListLite?.toggleCurrent?.(),
      openTask: () => (window as any).__taskListLite?.openCurrent?.(),
    })
    return unregister
  }, [])

  const markDone = useCallback(async (taskId: string) => {
    // Nur für EFU Aufgaben sinnvoll – bei Terminen existiert kein completed flag
    await supabase.from('enhanced_follow_ups').update({ completed_at: new Date().toISOString() }).eq('id', taskId)
    refreshAll()
  }, [refreshAll])

  const snooze = useCallback(async (taskId: string, days: number) => {
    await supabase.rpc('noop') // placeholder to ensure client available (no-op if function missing)
    await supabase.from('enhanced_follow_ups').update({ due_date: new Date(Date.now() + days*24*60*60*1000).toISOString().slice(0,10) }).eq('id', taskId)
    refreshAll()
  }, [refreshAll])

  const callLead = useCallback(async (leadId: string) => {
    const { data } = await supabase.from('leads').select('phone').eq('id', leadId).single()
    if (data?.phone) {
      window.open(`tel:${data.phone}`)
    } else if (onOpenLead) {
      onOpenLead(leadId)
    }
  }, [onOpenLead])

  if (loading) {
    return (
      <div className="p-6">
        <Spinner size={28} text="Lade tägliche Übersicht..." />
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-4 text-red-600">
        Fehler beim Laden der Daily Operations. <button className="underline" onClick={refreshAll}>Erneut versuchen</button>
      </div>
    )
  }

  

  const isSameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
  const isToday = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    return isSameDay(d, now)
  }

  const isZipInRanges = (zip: string | null, ranges: { from: string; to: string }[]) => {
    if (!zip) return false
    const z = parseInt(zip, 10)
    if (Number.isNaN(z)) return false
    return ranges.some(r => {
      const a = parseInt(r.from, 10)
      const b = parseInt(r.to, 10)
      if (Number.isNaN(a)) return false
      const to = Number.isNaN(b) ? a : b
      const min = Math.min(a, to)
      const max = Math.max(a, to)
      return z >= min && z <= max
    })
  }

  const matchesFilters = (t: { leadId: string; dueAt: string; priority: any; source?: 'efu'|'appointment' }) => {
    // Tagesfilter: wenn filters.date gesetzt → exakt dieses Datum; sonst optional onlyToday
    if (filters.date) {
      const d = new Date(t.dueAt)
      const wanted = new Date(filters.date)
      if (!isSameDay(d, wanted)) return false
    } else if (filters.onlyToday && !isToday(t.dueAt)) {
      return false
    }

    // source Filter
    if (filters.source && filters.source !== 'all') {
      const src = t as any
      if (src.source && src.source !== filters.source) return false
    }

    // enrichment
    const lead = leadById.get(t.leadId)

    // priorities
    if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority as any)) return false

    // owners
    if (filters.owners.length > 0) {
      const owner = lead?.user_id || null
      if (!owner || !filters.owners.includes(owner)) return false
    }

    // zip ranges
    if (filters.zipRanges.length > 0) {
      const zip = extractZipFromAddress(lead?.address)
      if (!isZipInRanges(zip, filters.zipRanges)) return false
    }

    // search (name, phone, address, zip)
    const q = (filters.search || '').trim()
    if (q) {
      const nQ = normalize(q)
      const name = normalize(lead?.name || '')
      const phone = normalize(lead?.phone || '')
      const addr = normalize(lead?.address || '')
      const zip = extractZipFromAddress(lead?.address) || ''
      const inName = fuzzyIncludes(name, nQ)
      const inPhone = fuzzyIncludes(phone, nQ)
      const inAddr = fuzzyIncludes(addr, nQ)
      const inZip = zip.includes(q)
      if (!(inName || inPhone || inAddr || inZip)) return false
    }

    return true
  }

  const overdueFiltered = overdue.map(t=>({ ...t, source: 'efu' as const })).filter(matchesFilters)
  const todayFiltered = today.map(t=>({ ...t, source: t.source })).filter(matchesFilters)

  return (
    <div className="space-y-4">
      <KpiBar />
      <SmartFilters />
      <Accordion title={`🔴 Überfällig (${overdueFiltered.length})`}>
        <ErrorBoundary fallback={<div className="p-3 text-sm text-red-600">Fehler in Überfällig-Liste</div>}>
          {overdueFiltered.length === 0 ? (
            <Empty text="Keine überfälligen Aufgaben" />
          ) : (
            <TaskListLite tasks={overdueFiltered} onOpenLead={onOpenLead} />
          )}
        </ErrorBoundary>
      </Accordion>

      <Accordion title={`${filters.date ? `📅 Ausgewählter Tag (${new Date(filters.date).toLocaleDateString('de-DE')})` : `⏰ Heute`} (${todayFiltered.length})`}>
        <ErrorBoundary fallback={<div className="p-3 text-sm text-red-600">Fehler in Heute-Liste</div>}>
          {todayFiltered.length === 0 ? (
            <Empty text="Heute keine Aufgaben" />
          ) : (
            <TaskListLite tasks={todayFiltered} onOpenLead={onOpenLead} />
          )}
          {filters.date && (
            <div className="mt-2 text-right">
              <button className="text-xs text-blue-600 underline" onClick={()=>setFilters({ date: null, source: 'all', onlyToday: true })}>Heute anzeigen</button>
            </div>
          )}
        </ErrorBoundary>
      </Accordion>

      <Accordion title="📋 Diese Woche">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {week.map(w => {
            const d = new Date(w.dayDate)
            const title = `${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })} – Follow-ups fällig: ${w.efuCount}, Termine: ${w.appointmentCount}`
            const dateISO = d.toISOString().slice(0,10)
            return (
              <div
                key={w.dayDate}
                className="p-3 bg-white rounded border text-sm hover:bg-gray-50"
                title={title}
              >
                <div className="font-medium">
                  {d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </div>
                <div className="mt-1 space-y-0.5">
                  <button className="block text-left w-full text-xs text-gray-700 hover:text-blue-700"
                          onClick={() => { setFilters({ date: dateISO, source: 'efu' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    🔁 Follow-ups fällig: <span className="font-medium">{w.efuCount}</span>
                  </button>
                  <button className="block text-left w-full text-xs text-gray-700 hover:text-blue-700"
                          onClick={() => { setFilters({ date: dateISO, source: 'appointment' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    📅 Termine: <span className="font-medium">{w.appointmentCount}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </Accordion>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: 'red' | 'amber' | 'green'; children: React.ReactNode }) {
  const border = color === 'red' ? 'border-red-200' : color === 'amber' ? 'border-amber-200' : 'border-green-200'
  const titleColor = color === 'red' ? 'text-red-700' : color === 'amber' ? 'text-amber-700' : 'text-green-700'
  return (
    <div className={`bg-gray-50 rounded-lg border ${border}`}>
      <div className={`px-4 py-2 border-b ${border} font-semibold ${titleColor}`}>{title}</div>
      <div className="p-2 md:p-3 lg:p-4">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="p-4 text-gray-500 text-sm">{text}</div>
}

function Actions({ onCall, onDone, onSnooze, isEfu, onOpen }: { onCall: () => void; onDone: () => void; onSnooze: (days: number) => void; isEfu: boolean; onOpen: () => void }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button className="px-2 py-1 text-blue-600 text-xs" onClick={onOpen}>Öffnen</button>
      <button className="px-2 py-1 text-emerald-600 text-xs" onClick={onCall}>Anrufen</button>
      {isEfu && <button className="px-2 py-1 text-amber-600 text-xs" onClick={() => onSnooze(1)}>+1T</button>}
      {isEfu && <button className="px-2 py-1 text-amber-600 text-xs" onClick={() => onSnooze(3)}>+3T</button>}
      {isEfu && <button className="px-2 py-1 text-amber-600 text-xs" onClick={() => onSnooze(7)}>+7T</button>}
      {isEfu && <button className="px-2 py-1 text-green-600 text-xs" onClick={onDone}>Erledigt</button>}
    </div>
  )
}

function formatTaskTitle(t: { title: string; source: string }) {
  if (t.source === 'efu') {
    const map: Record<string, string> = { call: 'Anruf', offer_followup: 'Angebots-Nachfassung', meeting: 'Termin', custom: 'Sonstiges' }
    return `${map[t.title] || t.title}`
  }
  return t.title
}

function formatOverdue(dueAt: string) {
  const diffMs = Date.now() - new Date(dueAt).getTime()
  const days = Math.floor(diffMs / (24*60*60*1000))
  const hours = Math.floor((diffMs % (24*60*60*1000)) / (60*60*1000))
  if (days > 0) return `${days} Tag${days>1?'e':''} überfällig`
  if (hours > 0) return `${hours} Std. überfällig`
  return 'überfällig'
}


