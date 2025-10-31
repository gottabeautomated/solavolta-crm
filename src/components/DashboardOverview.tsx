import React from 'react'
import { useTodayTasks, useOverdueTasks, useWeekOverview, useDashboardRealtime } from '../hooks/useDashboardSWR'
import { supabase } from '../lib/supabase'
// import { LoadingSpinner } from './ui/LoadingSpinner'
// import { Spinner } from './ui/LoadingStates'
// import { Accordion } from './ui/Accordion'
// import { KpiBar } from './KpiBar'
import { QuickStats } from './ui/QuickStats'
import { TodayAgenda } from './TodayAgenda'
import { ActionCard, type ActionTask } from './ui/ActionCard'
import { useDashboard } from '../contexts/DashboardContext'
import { useLeadIndex, extractZipFromAddress, normalize, fuzzyIncludes } from '../hooks/useLeadIndex'
import { SmartFilters } from './SmartFilters'
// import { TaskListLite } from './TaskListLite'
import { registerKeyboardShortcuts } from '../lib/keyboardShortcuts'
// import { ErrorBoundary } from './ui/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { useLeads } from '../hooks/useLeads'
import { normalizeStatus } from '../lib/statusUtils'
import { ArchiveLeadsModal } from './ArchiveLeadsModal'

interface Props {
  onOpenLead?: (leadId: string) => void
}

export function DashboardOverview({ onOpenLead }: Props) {
  try {
    useDashboardRealtime()
  } catch (err) {
    console.error('❌ DashboardRealtime error:', err)
  }
  
  const { items: overdue } = useOverdueTasks()
  const { items: today } = useTodayTasks()
  const { items: week } = useWeekOverview()
  const { filters } = useDashboard()
  const { byId: leadById } = useLeadIndex()
  // const listRef = React.useRef<{ focusFirst: () => void; focusNext: () => void; focusPrev: () => void; toggleCurrent: () => void; openCurrent: () => void } | null>(null)

  // const loading = lO || lT || lW
  // const error = eO || eT || eW

  // const refreshAll = useCallback(() => { rO(); rT(); rW() }, [rO, rT, rW])

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

  // const markDone = useCallback(async (taskId: string) => {
  //   // Nur für EFU Aufgaben sinnvoll – bei Terminen existiert kein completed flag
  //   await supabase.from('enhanced_follow_ups').update({ completed_at: new Date().toISOString() }).eq('id', taskId)
  //   refreshAll()
  // }, [refreshAll])

  // const snooze = useCallback(async (taskId: string, days: number) => {
  //   await supabase.rpc('noop')
  //   await supabase.from('enhanced_follow_ups').update({ due_date: new Date(Date.now() + days*24*60*60*1000).toISOString().slice(0,10) }).eq('id', taskId)
  //   refreshAll()
  // }, [refreshAll])

  // const callLead = useCallback(async (leadId: string) => {
  //   const { data } = await supabase.from('leads').select('phone').eq('id', leadId).single()
  //   if (data?.phone) {
  //     window.open(`tel:${data.phone}`)
  //   } else if (onOpenLead) {
  //     onOpenLead(leadId)
  //   }
  // }, [onOpenLead])

  // Hinweis: Alle Hooks müssen vor einem möglichen Early-Return stehen

  

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

  // Safety: ensure arrays are defined before mapping
  const safeOverdue = Array.isArray(overdue) ? overdue : []
  const safeToday = Array.isArray(today) ? today : []
  
  const overdueFiltered = safeOverdue.map(t=>({ ...t, source: 'efu' as const })).filter(matchesFilters)
  const todayFiltered = safeToday.map(t=>({ ...t, source: t.source })).filter(matchesFilters)

  // Mini-Karte: Nächster Schritt je Lead (Top 6) – Hooks VOR early returns platzieren
  // const [nextSteps, setNextSteps] = React.useState<Array<{ leadId: string; leadName: string; next: string; due: string | null }>>([])
  const { activeTenantId } = useAuth()
  const { leads } = useLeads()
  const [todayContacts, setTodayContacts] = React.useState<Array<{ lead_id: string; name?: string; phone?: string }>>([])
  const [contactFilters, setContactFilters] = React.useState({ neu: true, nichtErreicht: true, excludeArchived: true, excludeLost: true })
  const [todayAppointments, setTodayAppointments] = React.useState<Array<{ id: string; starts_at: string; lead_id: string; title: string }>>([])
  const [appointments7, setAppointments7] = React.useState<Array<{ id: string; starts_at: string; lead_id: string; title: string }>>([])
  const [showArchiveModal, setShowArchiveModal] = React.useState(false)

  React.useEffect(() => {
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); today.setHours(0,0,0,0)
      const iso = today.toISOString().slice(0,10)
      console.log('[DashboardOverview] useLeads count =', Array.isArray(leads) ? leads.length : 0)
      // 1) contact_attempts für heute
      const { data, error } = await supabase
        .from('contact_attempts')
        .select('lead_id, next_attempt_date')
        .eq('tenant_id', activeTenantId as any)
        .eq('next_attempt_date', iso)
        .order('contact_date', { ascending: false })
      if (error) return
      const attemptIds = Array.from(new Set((data || []).map((r: any) => r.lead_id)))
      console.log('[DashboardOverview] attempts today =', attemptIds.length)

      // 2) aus bereits geladenen Leads: Status-basiert kontaktierbare Leads
      const derived = Array.isArray(leads) ? leads.filter((l: any) => {
        const s = normalizeStatus(l?.lead_status)
        if (contactFilters.excludeArchived && (l as any)?.archived) return false
        if (contactFilters.excludeLost && s === 'verloren') return false
        const allowNeu = contactFilters.neu && s === 'neu'
        const allowNE = contactFilters.nichtErreicht && s.startsWith('nicht erreicht')
        return allowNeu || allowNE
      }) : []
      console.log('[DashboardOverview] derived contactable =', derived.length)

      // 3) Details für Attempt-Leads auflösen
      let attemptList: Array<{ lead_id: string; name?: string; phone?: string }> = []
      if (attemptIds.length > 0) {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, name, phone')
          .in('id', attemptIds as any)
        const map: Record<string, any> = {}
        ;(leadsData || []).forEach((l: any) => { map[l.id] = l })
        attemptList = attemptIds.map(id => ({ lead_id: id, name: map[id]?.name, phone: map[id]?.phone }))
      }

      // 4) Liste aus abgeleiteten Leads
      const derivedList = derived.map((l: any) => ({ lead_id: l.id, name: l.name, phone: l.phone }))

      // 5) Union & Dedupe
      const all = [...attemptList, ...derivedList]
      const seen = new Set<string>()
      const deduped = all.filter(it => {
        if (seen.has(it.lead_id)) return false
        seen.add(it.lead_id)
        return true
      })
      console.log('[DashboardOverview] todayContacts final size =', deduped.length)
      setTodayContacts(deduped)
    })()
  }, [activeTenantId, leads, contactFilters])

  // Termine der nächsten 7 Tage
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); today.setHours(0,0,0,0)
      const in7 = new Date(today); in7.setDate(in7.getDate()+7)
      const fromISO = today.toISOString().slice(0,10) + 'T00:00:00'
      const toISO = in7.toISOString().slice(0,10) + 'T23:59:59'
      const { data, error } = await supabase
        .from('appointments')
        .select('id, starts_at, lead_id, notes')
        .eq('tenant_id', activeTenantId as any)
        .gte('starts_at', fromISO)
        .lte('starts_at', toISO)
        .order('starts_at', { ascending: true })
      if (!mounted || error) return
      const items = (data || []).map((a: any) => ({ id: a.id, starts_at: a.starts_at, lead_id: a.lead_id, title: a.notes || 'Termin' }))
      setAppointments7(items as any)
    })()
    return () => { mounted = false }
  }, [activeTenantId])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); const from = today.toISOString().slice(0,10) + 'T00:00:00'
      const to = today.toISOString().slice(0,10) + 'T23:59:59'
      const { data, error } = await supabase
        .from('appointments')
        .select('id, starts_at, lead_id, notes')
        .eq('tenant_id', activeTenantId as any)
        .gte('starts_at', from)
        .lte('starts_at', to)
        .order('starts_at', { ascending: true })
      if (!mounted || error) return
      const items = (data || []).map((a: any) => ({ id: a.id, starts_at: a.starts_at, lead_id: a.lead_id, title: a.notes || 'Termin' }))
      setTodayAppointments(items as any)
    })()
    return () => { mounted = false }
  }, [activeTenantId])
  React.useEffect(() => {
    ;(async () => {
      if (!activeTenantId) return
      // hole nächste offenen EFUs pro Lead (einfach: die nächsten 6 EFUs heute/kommende Woche)
      const { data } = await supabase
        .from('enhanced_follow_ups')
        .select('lead_id, due_date, type, leads(name)')
        .eq('tenant_id', activeTenantId as any)
        .is('completed_at', null)
        .gte('due_date', new Date().toISOString().slice(0,10))
        .order('due_date', { ascending: true })
        .limit(12)
      const map: Record<string, { leadName: string; next: string; due: string | null }> = {}
      ;(data || []).forEach((row: any) => {
        if (!map[row.lead_id]) {
          const typeMap: Record<string, string> = { call: 'Anruf', offer_followup: 'Angebots-Nachfassung', meeting: 'Termin', custom: 'Aufgabe' }
          map[row.lead_id] = { leadName: row.leads?.name || 'Lead', next: typeMap[row.type] || row.type, due: row.due_date }
        }
      })
      // const items = Object.entries(map).slice(0, 6).map(([leadId, v]) => ({ leadId, leadName: v.leadName, next: v.next, due: v.due }))
      // setNextSteps(items)
    })()
  }, [activeTenantId, today.length])

  return (
    <div className="space-y-4 p-4 bg-yellow-200 border-4 border-red-500">
      {/* ⚠️ DEBUG: If you see this, the component renders! */}
      <div className="text-6xl text-red-600 font-black p-8 bg-white">
        🔥 DASHBOARD RENDERT! 🔥
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <button 
          onClick={() => setShowArchiveModal(true)}
          className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <span>🗄️</span>
          <span>Archivierung</span>
        </button>
      </div>
      
      <QuickStats onOpenLead={onOpenLead} />
      <SmartFilters />

      {/* Dringend zuerst */}
      {overdueFiltered.length > 0 && (
        <Section title={`🚨 Sofort handeln (${overdueFiltered.length})`} color="red">
          <div className="space-y-2">
            {overdueFiltered.slice(0,3).map(t => (
              <ActionCard key={t.taskId} task={{ id: t.taskId, leadId: t.leadId, title: t.title, dueAt: t.dueAt, priority: t.priority as any, source: t.source }} onOpenLead={onOpenLead} variant="urgent" />
            ))}
          </div>
        </Section>
      )}

      {/* Heute-Agenda */}
      <TodayAgenda
        tasks={todayFiltered.map(t => ({ id: t.taskId, leadId: t.leadId, title: t.title, dueAt: t.dueAt, priority: t.priority as any, source: t.source, notes: t.notes || null })) as ActionTask[]}
        onOpenLead={onOpenLead}
      />

      {/* Heute kontaktieren */}
      <Section title={`Heute kontaktieren (${todayContacts.length})`} color="amber">
        {/* Sichtbare Filter */}
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-gray-700">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={contactFilters.neu} onChange={e=>setContactFilters(f=>({ ...f, neu: e.target.checked }))} /> Neu
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={contactFilters.nichtErreicht} onChange={e=>setContactFilters(f=>({ ...f, nichtErreicht: e.target.checked }))} /> Nicht erreicht
          </label>
          <span className="mx-2 text-gray-300">|</span>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={contactFilters.excludeArchived} onChange={e=>setContactFilters(f=>({ ...f, excludeArchived: e.target.checked }))} /> Archivierte ausblenden
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={contactFilters.excludeLost} onChange={e=>setContactFilters(f=>({ ...f, excludeLost: e.target.checked }))} /> Verloren ausblenden
          </label>
        </div>
        {todayContacts.length === 0 ? (
          <div>
            <Empty text="Keine Kontakte heute." />
            <div className="text-[11px] text-gray-500 mt-1">
              Debug: Leads gesamt {Array.isArray(leads) ? leads.length : 0}
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {(todayContacts || []).map((it) => (
              <li key={it.lead_id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{it.name || it.lead_id}</div>
                  {it.phone && <div className="text-xs text-gray-600 truncate">📞 {it.phone}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {it.phone && <button className="text-emerald-600 text-xs" onClick={() => window.open(`tel:${it.phone}`)}>Anrufen</button>}
                  <button className="text-blue-600 text-xs" onClick={() => onOpenLead?.(it.lead_id)}>Öffnen</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Termine heute */}
      <Section title={`Termine heute (${todayAppointments.length})`} color="green">
        {todayAppointments.length === 0 ? (
          <Empty text="Keine Termine heute." />
        ) : (
          <ul className="divide-y">
            {(todayAppointments || []).map(a => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{new Date(a.starts_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {a.title}</div>
                </div>
                <button className="text-blue-600 text-xs" onClick={() => onOpenLead?.(a.lead_id)}>Öffnen</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Kommende Termine (7 Tage) */}
      <Section title={`Kommende Termine (7 Tage) (${appointments7.length})`} color="green">
        {appointments7.length === 0 ? (
          <Empty text="Keine Termine in den nächsten 7 Tagen." />
        ) : (
          <ul className="divide-y">
            {(appointments7 || []).map(a => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{new Date(a.starts_at).toLocaleString('de-DE')}</div>
                  {a.title && <div className="text-xs text-gray-600 truncate">{a.title}</div>}
                </div>
                <button className="text-blue-600 text-xs" onClick={() => onOpenLead?.(a.lead_id)}>Öffnen</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Kompakte Wochenübersicht */}
      <Section title="Diese Woche" color="green">
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {(week || []).map(w => {
            const d = new Date(w.dayDate)
            return (
              <div key={w.dayDate} className="p-3 bg-white rounded border text-sm">
                <div className="font-medium">
                  {d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                </div>
                <div className="mt-1 space-y-0.5">
                  <div className="text-xs text-gray-700">🔁 Follow-ups: <span className="font-medium">{w.efuCount}</span></div>
                  <div className="text-xs text-gray-700">📅 Termine: <span className="font-medium">{w.appointmentCount}</span></div>
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Archivierungs-Modal */}
      <ArchiveLeadsModal 
        isOpen={showArchiveModal} 
        onClose={() => setShowArchiveModal(false)}
        onArchived={() => {
          // Optional: Daten neu laden wenn nötig
          setShowArchiveModal(false)
        }}
      />
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

// Actions helper derzeit ungenutzt

// formatTaskTitle helper derzeit ungenutzt

// formatOverdue helper derzeit ungenutzt


