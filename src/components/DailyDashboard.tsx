import React from 'react'
import { useTodayTasks, useOverdueTasks, useWeekOverview, usePriorities, useDashboardRealtime } from '../hooks/useDashboardSWR'
import { TaskListLite } from './TaskListLite'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useEnhancedFollowUps } from '../hooks/useEnhancedFollowUps'
import { isDerivedContactCandidate, normalizeStatus } from '../lib/statusUtils'
import { useLeads } from '../hooks/useLeads'

interface Props {
  onOpenLead?: (leadId: string) => void
}

export function DailyDashboard({ onOpenLead }: Props) {
  useDashboardRealtime()
  const { items: today, loading: loadingToday, error: errorToday, revalidate: rToday } = useTodayTasks()
  const { items: overdue, loading: loadingOverdue, error: errorOverdue, revalidate: rOverdue } = useOverdueTasks()
  const { items: week, loading: loadingWeek, error: errorWeek, revalidate: rWeek } = useWeekOverview()
  const { items: priorities, loading: loadingPrio, error: errorPrio, revalidate: rPrio } = usePriorities()
  const { activeTenantId } = useAuth()
  const efu = useEnhancedFollowUps()
  const { leads, loading: leadsLoading } = useLeads()

  // Debug-Start
  try {
    console.log('🔍 === DASHBOARD DEBUG START ===')
    console.log('Dashboard Component mounted')
    console.log('Auth activeTenantId =', activeTenantId)
    console.log('Calling useLeads...')
    const leadsCount = Array.isArray(leads) ? leads.length : 'undefined'
    const statuses = Array.isArray(leads) ? Array.from(new Set(leads.map((l: any) => String(l.lead_status)))) : []
    console.log('useLeads count =', leadsCount, 'loading =', !!leadsLoading, 'statuses =', statuses)
  } catch {}

  const [weekAppointments, setWeekAppointments] = React.useState<Array<{ id: string; starts_at: string; lead_id: string; title: string }>>([])
  const [upcomingEfus, setUpcomingEfus] = React.useState<Array<{ id: string; due_date: string; lead_id: string; type: string; notes?: string }>>([])
  const [todayContacts, setTodayContacts] = React.useState<Array<{ lead_id: string; next_attempt_date: string; name?: string; phone?: string }>>([])
  const [appointments7, setAppointments7] = React.useState<Array<{ id: string; starts_at: string; lead_id: string; title: string }>>([])
  const [debugLeads, setDebugLeads] = React.useState<Array<{ id: string; lead_status: string; name?: string }>>([])
  const [contactFilters, setContactFilters] = React.useState({ neu: true, nichtErreicht: true, excludeArchived: true, excludeLost: true })

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const now = new Date()
      const monday = startOfWeek(now)
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      const fromISO = toDateISO(monday) + 'T00:00:00'
      const toISO = toDateISO(sunday) + 'T23:59:59'
      const { data, error } = await supabase
        .from('appointments')
        .select('id, starts_at, lead_id, notes')
        .eq('tenant_id', activeTenantId as any)
        .gte('starts_at', fromISO)
        .lte('starts_at', toISO)
        .order('starts_at', { ascending: true })
      if (!mounted) return
      if (!error) {
        const items = (data || []).map((a: any) => ({ id: a.id as string, starts_at: a.starts_at as string, lead_id: a.lead_id as string, title: a.notes || 'Termin' }))
        setWeekAppointments(items)
      }
    })()
    return () => { mounted = false }
  }, [activeTenantId])

  // Direkter Supabase-Diagnose-Call (prüft, ob überhaupt Leads für den Tenant zurückkommen)
  React.useEffect(() => {
    if (!activeTenantId) return
    console.log('🔧 Direct Supabase test...')
    supabase
      .from('leads')
      .select('id, lead_status, name')
      .eq('tenant_id', activeTenantId as any)
      .then(({ data, error }) => {
        console.log('Direct query result:', { count: data?.length || 0, error: error?.message })
        setDebugLeads(data || [])
      })
  }, [activeTenantId])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); today.setHours(0,0,0,0)
      const in7 = new Date(today); in7.setDate(in7.getDate()+7)
      const fromISO = toDateISO(today) + 'T00:00:00'
      const toISO = toDateISO(in7) + 'T23:59:59'
      const { data, error } = await supabase
        .from('appointments')
        .select('id, starts_at, lead_id, notes')
        .eq('tenant_id', activeTenantId as any)
        .gte('starts_at', fromISO)
        .lte('starts_at', toISO)
        .order('starts_at', { ascending: true })
      if (!mounted) return
      if (!error) {
        const items = (data || []).map((a: any) => ({ id: a.id as string, starts_at: a.starts_at as string, lead_id: a.lead_id as string, title: a.notes || 'Termin' }))
        setAppointments7(items)
      }
    })()
    return () => { mounted = false }
  }, [activeTenantId])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); today.setHours(0,0,0,0)
      const in7 = new Date(today); in7.setDate(in7.getDate()+7)
      const from = toDateISO(today)
      const to = toDateISO(in7)
      const { data, error } = await supabase
        .from('enhanced_follow_ups')
        .select('id, lead_id, due_date, type, notes')
        .eq('tenant_id', activeTenantId as any)
        .is('completed_at', null)
        .gte('due_date', from)
        .lte('due_date', to)
        .order('due_date', { ascending: true })
      if (!mounted) return
      if (!error) setUpcomingEfus((data || []) as any)
    })()
    return () => { mounted = false }
  }, [activeTenantId])

  // Heute zu kontaktieren (Union: contact_attempts.next_attempt_date == heute OR Leads mit Status Neu/Nicht erreicht)
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!activeTenantId) return
      const today = new Date(); today.setHours(0,0,0,0)
      const iso = toDateISO(today)
      const { data, error } = await supabase
        .from('contact_attempts')
        .select('lead_id, next_attempt_date')
        .eq('tenant_id', activeTenantId as any)
        .eq('next_attempt_date', iso)
        .order('contact_date', { ascending: false })
      if (!mounted || error) return
      const attemptLeadIds = Array.from(new Set((data || []).map((r: any) => r.lead_id)))

      // Neue Leads / Nicht erreicht aus bereits geladenen Leads ableiten (gleiche RLS/Tenant-Filter wie Lead-Liste)
      const derived = Array.isArray(leads) ? leads.filter((l: any) => {
        const s = normalizeStatus(l?.lead_status)
        if (contactFilters.excludeArchived && (l as any)?.archived) return false
        if (contactFilters.excludeLost && s === 'verloren') return false
        const allowNeu = contactFilters.neu && s === 'neu'
        const allowNE = contactFilters.nichtErreicht && s.startsWith('nicht erreicht')
        return allowNeu || allowNE
      }) : []
      console.log('Heute-kontaktieren: leads total', Array.isArray(leads) ? leads.length : 0, 'derived', derived.length)
      // Debug: Prüfe konkrete UUID, wenn vorhanden
      const DEBUG_ID = '03c4bf7b-a1d1-457c-a13f-db35b693c1a4'
      if (derived.some((l: any) => l.id === DEBUG_ID)) {
        const hit = derived.find((l: any) => l.id === DEBUG_ID)
        console.log('Heute-kontaktieren: DEBUG Lead gefunden in derived leads', hit?.id, hit?.lead_status)
      } else {
        console.log('Heute-kontaktieren: DEBUG Lead NICHT in derived leads')
      }
      let newList: any[] = derived.map((l: any) => ({ lead_id: l.id, next_attempt_date: iso, name: l.name, phone: l.phone }))

      // Fallback: Wenn aus useLeads() nichts kommt, hole direkt per Tenant (ohne user_id-Filter)
      if (newList.length === 0) {
        const { data: fallback, error: fbErr } = await supabase
          .from('leads')
          .select('id, name, phone, lead_status')
          .eq('tenant_id', activeTenantId as any)
          .or('lead_status.ilike.Neu%25,lead_status.ilike.Nicht%20erreicht%25')
          .limit(100)
        if (!fbErr && (fallback || []).length > 0) {
          console.log('Heute-kontaktieren: fallback query Treffer', (fallback || []).length)
          newList = (fallback || []).map((l: any) => ({ lead_id: l.id, next_attempt_date: iso, name: l.name, phone: l.phone }))
        } else {
          if (fbErr) console.log('Heute-kontaktieren: fallback query Error', fbErr.message)
        }
      }

      // Details der Attempt-Leads auflösen
      let attemptList: any[] = []
      if (attemptLeadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from('leads')
          .select('id, name, phone')
          .in('id', attemptLeadIds as any)
        const map: Record<string, any> = {}
        ;(leadsData || []).forEach((l: any) => { map[l.id] = l })
        attemptList = attemptLeadIds.map(id => ({ lead_id: id, next_attempt_date: iso, name: map[id]?.name || null, phone: map[id]?.phone || null }))
        console.debug('Heute-kontaktieren: attempts', attemptList.length)
      }

      // Union & Dedupe
      const all = [...attemptList, ...newList]
      const seen = new Set<string>()
      const deduped = all.filter(it => {
        if (seen.has(it.lead_id)) return false
        seen.add(it.lead_id)
        return true
      })
      console.log('Heute-kontaktieren: final set size', deduped.length)
      setTodayContacts(deduped as any)
    })()
    return () => { mounted = false }
  }, [activeTenantId, leads, contactFilters])

  const loading = loadingToday || loadingOverdue || loadingWeek || loadingPrio
  const error = errorToday || errorOverdue || errorWeek || errorPrio

  if (loading) return <div className="p-4">Lade Dashboard…</div>
  if (error) return <div className="p-4 text-red-600">{String(error)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Daily Dashboard</h2>
        <button className="text-sm text-blue-600" onClick={() => { rToday(); rOverdue(); rWeek(); rPrio(); }}>Aktualisieren</button>
      </div>

      {/* Kopf-Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatTile label="Überfällig" value={overdue.length} color="red" />
        <StatTile label="Heute" value={today.length} color="blue" />
        <StatTile label="Diese Woche (FU+Termine)" value={week.reduce((n,w)=> n + (w.efuCount||0) + (w.appointmentCount||0), 0)} color="amber" />
      </div>

      {/* Hauptbereich: Heute links, Nächste 7 Tage rechts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={`Heute (${today.length})`}>
          {today.length === 0 ? (
            <div className="text-gray-500">Heute keine Aufgaben</div>
          ) : (
            <TaskListLite tasks={today} onOpenLead={onOpenLead} />
          )}
        </Card>
        <Card title="Kalender – diese Woche">
          <WeekCalendar appointments={weekAppointments} onOpenLead={onOpenLead} />
        </Card>
      </div>

      {/* Fuß: Top Leads + kompakte Wochenübersicht + getrennte Listen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top Leads">
          <ul className="divide-y">
            {priorities.map((p) => (
              <li key={p.leadId} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name || p.email || p.phone || p.leadId}</div>
                  <div className="text-xs text-gray-600">Priorität: {p.topPriority} {p.nextDue ? `• Nächste Fälligkeit: ${new Date(p.nextDue).toLocaleDateString('de-DE')}` : ''}</div>
                </div>
                <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(p.leadId)}>Öffnen</button>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Woche (Anzahl je Tag)">
          <div className="grid grid-cols-7 gap-2 text-sm">
            {week.map((d) => {
              const dt = new Date(d.dayDate)
              const label = dt.toLocaleDateString('de-DE', { weekday: 'short' })
              const day = dt.getDate().toString().padStart(2, '0')
              return (
                <div key={d.dayDate} className="p-2 bg-white rounded border text-center">
                  <div className="text-xs text-gray-600">{label} · {day}.{(dt.getMonth()+1).toString().padStart(2,'0')}</div>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span title="Follow-ups" className={`px-2 py-0.5 rounded-full text-xs ${d.efuCount>0 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>FU {d.efuCount}</span>
                    <span title="Termine" className={`px-2 py-0.5 rounded-full text-xs ${d.appointmentCount>0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>TA {d.appointmentCount}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
        <Card title={`Heute kontaktieren (${todayContacts.length})`}>
          {/* Sichtbare Filter – ganz oben platzieren */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-700">
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
              <div className="text-gray-500 text-sm">Keine Kontakte heute.</div>
              <div className="text-[11px] text-gray-500 mt-1">
                Debug: Leads gesamt {Array.isArray(leads) ? leads.length : 0} · kontaktierbar {Array.isArray(leads) ? leads.filter((l: any) => {
                  const s = normalizeStatus(l?.lead_status)
                  if (contactFilters.excludeArchived && (l as any)?.archived) return false
                  if (contactFilters.excludeLost && s === 'verloren') return false
                  const allowNeu = contactFilters.neu && s === 'neu'
                  const allowNE = contactFilters.nichtErreicht && s.startsWith('nicht erreicht')
                  return allowNeu || allowNE
                }).length : 0} · directQuery {debugLeads.length}
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {todayContacts.map(it => (
                <li key={it.lead_id} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{it.name || it.lead_id}</div>
                    {it.phone && <div className="text-xs text-gray-600 truncate">📞 {it.phone}</div>}
                  </div>
                  <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(it.lead_id)}>Öffnen</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Wiedervorlagen (Heute/Überfällig)">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Heute</div>
              {efu.today?.length === 0 ? <div className="text-gray-500 text-sm">Keine</div> : (
                <ul className="divide-y">
                  {efu.today.map((it: any) => (
                    <li key={it.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{it.type} · {new Date(it.due_date).toLocaleDateString('de-DE')}</div>
                        {it.notes && <div className="text-xs text-gray-600 truncate">{it.notes}</div>}
                      </div>
                      <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(it.lead_id)}>Öffnen</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Überfällig</div>
              {efu.overdue?.length === 0 ? <div className="text-gray-500 text-sm">Keine</div> : (
                <ul className="divide-y">
                  {efu.overdue.map((it: any) => (
                    <li key={it.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{it.type} · {new Date(it.due_date).toLocaleDateString('de-DE')}</div>
                        {it.notes && <div className="text-xs text-gray-600 truncate">{it.notes}</div>}
                      </div>
                      <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(it.lead_id)}>Öffnen</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
        <Card title="Kommende Termine (7 Tage)">
          {appointments7.length === 0 ? (
            <div className="text-gray-500 text-sm">Keine Termine in den nächsten 7 Tagen.</div>
          ) : (
            <ul className="divide-y">
              {appointments7.map(a => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{new Date(a.starts_at).toLocaleString('de-DE')}</div>
                    {a.title && <div className="text-xs text-gray-600 truncate">{a.title}</div>}
                  </div>
                  <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(a.lead_id)}>Öffnen</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded border">
      <div className="px-4 py-2 border-b font-semibold">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// Legacy simple list removed; TaskListLite used instead

function StatTile({ label, value, color }: { label: string; value: number; color: 'red'|'blue'|'amber' }) {
  const map = {
    red: 'bg-red-50 border-red-200 text-red-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700'
  }
  return (
    <div className={`rounded border ${map[color]} p-3`}>
      <div className="text-sm">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function startOfWeek(d: Date) {
  const x = new Date(d)
  const day = x.getDay() || 7
  if (day !== 1) x.setHours(-24 * (day - 1))
  x.setHours(0,0,0,0)
  return x
}

function toDateISO(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

function WeekCalendar({ appointments, onOpenLead }: { appointments: Array<{ id: string; starts_at: string; lead_id: string; title: string }>; onOpenLead?: (id: string) => void }) {
  const days = React.useMemo(() => {
    const today = new Date()
    const mon = startOfWeek(today)
    return new Array(7).fill(null).map((_,i) => {
      const d = new Date(mon); d.setDate(mon.getDate()+i)
      return d
    })
  }, [])

  const grouped = React.useMemo(() => {
    const map: Record<string, Array<{ id: string; starts_at: string; lead_id: string; title: string }>> = {}
    appointments.forEach(a => {
      const key = toDateISO(new Date(a.starts_at))
      if (!map[key]) map[key] = []
      map[key].push(a)
    })
    return map
  }, [appointments])

  return (
    <div className="grid grid-cols-7 gap-2 text-xs">
      {days.map((d) => {
        const key = toDateISO(d)
        const items = grouped[key] || []
        return (
          <div key={key} className="bg-white rounded border p-2 min-h-[90px]">
            <div className="text-gray-600 mb-1">
              {d.toLocaleDateString('de-DE', { weekday: 'short' })} {d.getDate().toString().padStart(2,'0')}
            </div>
            <div className="space-y-1">
              {items.length === 0 && <div className="text-gray-400">–</div>}
              {items.map(a => (
                <button key={a.id} className="block w-full text-left truncate hover:text-blue-700" onClick={() => onOpenLead?.(a.lead_id)}>
                  {new Date(a.starts_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {a.title}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function UpcomingList({ items, onOpenLead }: { items: Array<{ id: string; due_date: string; lead_id: string; type: string; notes?: string }>; onOpenLead?: (id: string) => void }) {
  return (
    <ul className="divide-y">
      {items.map(it => (
        <li key={it.id} className="py-2 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{new Date(it.due_date).toLocaleDateString('de-DE')} · {it.type}</div>
            {it.notes && <div className="text-xs text-gray-600 truncate">{it.notes}</div>}
          </div>
          <button className="text-blue-600 text-sm" onClick={() => onOpenLead?.(it.lead_id)}>Öffnen</button>
        </li>
      ))}
    </ul>
  )
}


