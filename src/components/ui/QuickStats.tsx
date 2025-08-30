import React from 'react'
import { useLeads } from '../../hooks/useLeads'
import { useTodayTasks, useOverdueTasks } from '../../hooks/useDashboardSWR'
import { useAuth } from '../../hooks/useAuth'
import { useLeadIndex } from '../../hooks/useLeadIndex'
import { supabase } from '../../lib/supabase'

export function QuickStats({ onOpenLead }: { onOpenLead?: (id: string) => void }) {
  const { leads } = useLeads()
  const { items: today } = useTodayTasks()
  const { items: overdue } = useOverdueTasks()
  const { activeTenantId } = useAuth()

  const [appointmentsToday, setAppointmentsToday] = React.useState<number>(0)
  const [slaContactOverdue, setSlaContactOverdue] = React.useState<number>(0)
  const [offersOpen, setOffersOpen] = React.useState<number>(0)
  const [conversion30, setConversion30] = React.useState<number>(0)
  const [offersValue, setOffersValue] = React.useState<number>(0)
  const [wonValue30, setWonValue30] = React.useState<number>(0)
  const [salesKpis, setSalesKpis] = React.useState<null | {
    new_leads: number
    won_leads: number
    lost_leads: number
    offers_out: number
    in_contact_phase: number
    conversion_rate: number
    offer_rate: number
    sla_breaches: number
    avg_hours_to_close: number
    avg_hours_to_offer: number
    days_analyzed: number
  }>(null)

  React.useEffect(() => {
    ;(async () => {
      if (!activeTenantId) return
      try {
        const start = new Date(); start.setHours(0,0,0,0)
        const end = new Date(); end.setHours(23,59,59,999)
        const startISO = start.toISOString()
        const endISO = end.toISOString()

        // Termine heute
        const { data: appts } = await supabase
          .from('appointments')
          .select('id')
          .eq('tenant_id', activeTenantId as any)
          .gte('starts_at', startISO)
          .lte('starts_at', endISO)
        setAppointmentsToday((appts || []).length)

        // SLA Kontakt überfällig: Neu/Kontaktiert älter als 24h
        const since = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10) // status_since ist date
        const { data: sla } = await supabase
          .from('leads')
          .select('id')
          .eq('tenant_id', activeTenantId as any)
          .in('lead_status', ['Neu','Kontaktiert'] as any)
          .lt('status_since', since)
        setSlaContactOverdue((sla || []).length)

        // Angebote offen: Angebot übermittelt, nicht Gewonnen/TVP
        const { data: openOffers } = await supabase
          .from('leads')
          .select('id')
          .eq('tenant_id', activeTenantId as any)
          .eq('lead_status', 'Angebot übermittelt')
          .neq('lead_status', 'Gewonnen')
          .eq('tvp', false as any)
        setOffersOpen((openOffers || []).length)

        // Conversion 30 Tage: Gewonnen / (Neu+Kontaktiert) in letzten 30 Tagen
        const d30 = new Date(Date.now() - 30*24*60*60*1000).toISOString()
        const [{ data: won }, { data: base }] = await Promise.all([
          supabase.from('leads').select('id').eq('tenant_id', activeTenantId as any).eq('lead_status', 'Gewonnen').gte('created_at', d30),
          supabase.from('leads').select('id').eq('tenant_id', activeTenantId as any).in('lead_status', ['Neu','Kontaktiert'] as any).gte('created_at', d30),
        ])
        const w = (won || []).length
        const b = Math.max(1, (base || []).length)
        setConversion30(Math.round((w / b) * 100))

        // Sales KPIs (30 Tage) nur über View (keine RPCs → keine 404)
        async function fetchKpis() {
          try {
            const { data } = await supabase
              .from('v_sales_kpis_30')
              .select('*')
              .eq('tenant_id', activeTenantId as any)
              .single()
            if (data) return data as any
          } catch {}
          return null
        }
        const kpis = await fetchKpis()
        if (kpis) setSalesKpis(kpis)

        // Wert offene Angebote (sum offer_amount bei Angebots-Status)
        const { data: offersVal } = await supabase
          .from('leads')
          .select('offer_amount')
          .eq('tenant_id', activeTenantId as any)
          .in('lead_status', ['Angebot erstellt','Angebot übermittelt'] as any)
        setOffersValue((offersVal || []).reduce((acc: number, r: any) => acc + (Number(r.offer_amount) || 0), 0))

        // Wert gewonnen letzte 30 Tage
        const d30v = new Date(Date.now() - 30*24*60*60*1000).toISOString()
        const { data: wonVal } = await supabase
          .from('leads')
          .select('offer_amount, won_at, updated_at')
          .eq('tenant_id', activeTenantId as any)
          .eq('lead_status', 'Gewonnen')
          .or(`won_at.gte.${d30v},and(won_at.is.null,updated_at.gte.${d30v})` as any)
        setWonValue30((wonVal || []).reduce((acc: number, r: any) => acc + (Number(r.offer_amount) || 0), 0))
      } catch {
        // ignore subtle errors in stats fetch
      }
    })()
  }, [activeTenantId])

  const count = (status: string) => (leads || []).filter(l => l.lead_status === status).length

  const finalOffersOpen = (salesKpis?.offers_out ?? offersOpen) as number
  const finalConversion = Math.round((salesKpis?.conversion_rate ?? conversion30) as number)

  const stats = [
    { label: 'Überfällig', value: overdue.length, icon: '🚨', color: overdue.length>0? 'text-red-600':'text-gray-400' },
    { label: 'Heute fällig', value: today.length, icon: '📅', color: 'text-blue-600' },
    { label: 'Termine heute', value: appointmentsToday, icon: '🗓️', color: 'text-indigo-600' },
    { label: 'SLA Kontakt >24h', value: slaContactOverdue, icon: '⏱️', color: slaContactOverdue>0? 'text-red-600':'text-gray-400' },
    { label: 'Angebote offen', value: finalOffersOpen, icon: '📄', color: 'text-amber-600' },
    { label: 'Conversion 30d', value: `${finalConversion}%` as any, icon: '📈', color: 'text-emerald-600' },
    { label: 'Offers-Wert', value: offersValue.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' }) as any, icon: '💶', color: 'text-amber-700' },
    { label: 'Gewonnen-Wert 30d', value: wonValue30.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' }) as any, icon: '🏆', color: 'text-emerald-700' },
  ]

  // Details Modal State
  const [open, setOpen] = React.useState<null | 'overdue' | 'today' | 'appts' | 'sla' | 'offers' | 'conv' | 'offers_value' | 'won_value'>(null)
  const [items, setItems] = React.useState<any[]>([])
  const loadingRef = React.useRef(false)
  const { byId: leadById } = useLeadIndex()

  const loadDetails = async (kind: 'overdue'|'today'|'appts'|'sla'|'offers'|'conv'|'offers_value'|'won_value') => {
    if (!activeTenantId || loadingRef.current) return
    loadingRef.current = true
    try {
      if (kind === 'overdue') {
        const { data } = await supabase.from('v_overdue_tasks').select('*').eq('tenant_id', activeTenantId as any)
        setItems(data || [])
      } else if (kind === 'today') {
        const { data } = await supabase.from('v_today_tasks').select('*').eq('tenant_id', activeTenantId as any)
        setItems(data || [])
      } else if (kind === 'appts') {
        const start = new Date(); start.setHours(0,0,0,0)
        const end = new Date(); end.setHours(23,59,59,999)
        const { data } = await supabase.from('appointments').select('id, lead_id, starts_at, notes').eq('tenant_id', activeTenantId as any).gte('starts_at', start.toISOString()).lte('starts_at', end.toISOString()).order('starts_at', { ascending: true })
        setItems(data || [])
      } else if (kind === 'sla') {
        const since = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10)
        const { data } = await supabase.from('leads').select('id, name, phone, lead_status, status_since').eq('tenant_id', activeTenantId as any).in('lead_status', ['Neu','Kontaktiert'] as any).lt('status_since', since)
        setItems(data || [])
      } else if (kind === 'offers') {
        // Offen = Status "Angebot erstellt" (neu) oder historisch "Angebot übermittelt"
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, lead_status, updated_at')
          .eq('tenant_id', activeTenantId as any)
          .in('lead_status', ['Angebot erstellt', 'Angebot übermittelt'] as any)
        setItems(data || [])
      } else if (kind === 'conv') {
        // Gewonnen in den letzten 30 Tagen basierend auf won_at (Fallback: updated_at)
        const d30 = new Date(Date.now() - 30*24*60*60*1000).toISOString()
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, lead_status, won_at, updated_at')
          .eq('tenant_id', activeTenantId as any)
          .eq('lead_status', 'Gewonnen')
          .or(`won_at.gte.${d30},and(won_at.is.null,updated_at.gte.${d30})` as any)
        setItems(data || [])
      } else if (kind === 'offers_value') {
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, lead_status, offer_amount')
          .eq('tenant_id', activeTenantId as any)
          .in('lead_status', ['Angebot erstellt','Angebot übermittelt'] as any)
          .order('offer_amount', { ascending: false })
        setItems(data || [])
      } else if (kind === 'won_value') {
        const d30 = new Date(Date.now() - 30*24*60*60*1000).toISOString()
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, offer_amount, won_at, updated_at')
          .eq('tenant_id', activeTenantId as any)
          .eq('lead_status', 'Gewonnen')
          .or(`won_at.gte.${d30},and(won_at.is.null,updated_at.gte.${d30})` as any)
          .order('offer_amount', { ascending: false })
        setItems(data || [])
      }
      setOpen(kind)
    } finally {
      loadingRef.current = false
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
        <button onClick={()=>loadDetails('overdue')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">🚨</div>
          <div className={`text-2xl font-bold ${overdue.length>0? 'text-red-600':'text-gray-600'}`}>{overdue.length}</div>
          <div className="text-sm text-gray-600">Überfällig</div>
        </button>
        <button onClick={()=>loadDetails('today')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">📅</div>
          <div className={`text-2xl font-bold text-blue-600`}>{today.length}</div>
          <div className="text-sm text-gray-600">Heute fällig</div>
        </button>
        <button onClick={()=>loadDetails('appts')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">🗓️</div>
          <div className={`text-2xl font-bold text-indigo-600`}>{appointmentsToday}</div>
          <div className="text-sm text-gray-600">Termine heute</div>
        </button>
        <button onClick={()=>loadDetails('sla')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">⏱️</div>
          <div className={`text-2xl font-bold ${slaContactOverdue>0? 'text-red-600':'text-gray-600'}`}>{slaContactOverdue}</div>
          <div className="text-sm text-gray-600">SLA Kontakt &gt;24h</div>
        </button>
        <button onClick={()=>loadDetails('offers')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">📄</div>
          <div className={`text-2xl font-bold text-amber-600`}>{offersOpen}</div>
          <div className="text-sm text-gray-600">Angebote offen</div>
        </button>
        <button onClick={()=>loadDetails('conv')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">📈</div>
          <div className={`text-2xl font-bold text-emerald-600`}>{`${conversion30}%`}</div>
          <div className="text-sm text-gray-600">Conversion 30d</div>
        </button>
        <button onClick={()=>loadDetails('offers_value')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">💶</div>
          <div className={`text-lg font-bold text-amber-700 truncate`}>{offersValue.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}</div>
          <div className="text-sm text-gray-600">Offers-Wert</div>
        </button>
        <button onClick={()=>loadDetails('won_value')} className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:shadow cursor-pointer">
          <div className="text-2xl mb-1">🏆</div>
          <div className={`text-lg font-bold text-emerald-700 truncate`}>{wonValue30.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' })}</div>
          <div className="text-sm text-gray-600">Gewonnen-Wert 30d</div>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[3000]">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpen(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-white shadow-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">{label(open)}</div>
              <button className="text-gray-600" onClick={()=>setOpen(null)}>✕</button>
            </div>
            {items.length === 0 ? (
              <div className="text-sm text-gray-500">Keine Einträge</div>
            ) : (
              <ul className="divide-y">
                {items.map((it: any) => {
                  const leadId = it.lead_id || it.leadId || it.id
                  const lead = leadById.get(leadId)
                  const name = lead?.name || it.name || '—'
                  const phone = lead?.phone || it.phone || ''
                  const secondary = formatSecondary(open as any, it)
                  return (
                    <li key={it.id || it.task_id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{name}</div>
                        <div className="text-xs text-gray-600 truncate">{secondary} {phone ? `• ${phone}`: ''}</div>
                      </div>
                      {leadId && (
                        <button className="text-blue-600 text-sm" onClick={()=>{ setOpen(null); onOpenLead?.(leadId) }}>Öffnen</button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function label(kind: 'overdue'|'today'|'appts'|'sla'|'offers'|'conv'|'offers_value'|'won_value') {
  return kind==='overdue' ? 'Überfällige Aufgaben' :
         kind==='today' ? 'Heute fällige Aufgaben' :
         kind==='appts' ? 'Termine heute' :
         kind==='sla' ? 'SLA Kontakt >24h' :
         kind==='offers' ? 'Offene Angebote' :
         kind==='offers_value' ? 'Offers-Wert' :
         kind==='won_value' ? 'Gewonnen-Wert 30 Tage' :
         'Gewonnen (30 Tage)'
}

function formatSecondary(kind: 'overdue'|'today'|'appts'|'sla'|'offers'|'conv'|'offers_value'|'won_value', it: any) {
  if (kind === 'appts') {
    try {
      return new Date(it.starts_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }
  if (kind === 'overdue' || kind === 'today') {
    const t = (it.title || '').toString()
    const map: Record<string,string> = { call: 'Anruf', offer_followup: 'Angebots-Nachfassung', meeting: 'Termin', custom: 'Aufgabe' }
    const type = map[t] || t
    return `${type}${it.due_at ? ` • ${new Date(it.due_at).toLocaleDateString('de-DE')}` : ''}`
  }
  if (kind === 'sla') {
    return `Status: ${it.lead_status || '—'}${it.status_since ? ` • seit ${new Date(it.status_since).toLocaleDateString('de-DE')}` : ''}`
  }
  if (kind === 'offers') {
    return it.lead_status || 'Angebot'
  }
  if (kind === 'conv') {
    const d = it.won_at || it.updated_at || it.created_at
    try { return `Gewonnen am ${new Date(d).toLocaleDateString('de-DE')}` } catch { return 'Gewonnen' }
  }
  if (kind === 'offers_value' || kind === 'won_value') {
    const v = Number(it.offer_amount) || 0
    return v ? v.toLocaleString('de-AT', { style: 'currency', currency: 'EUR' }) : '—'
  }
  return ''
}


