import React from 'react'
import { useNotifications } from '../hooks/useNotifications'
import { openLeadDetail } from '../lib/eventBus'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useLeadIndex } from '../hooks/useLeadIndex'

type Category = 'all' | 'sla' | 'leads' | 'system'

function typeToCategory(type?: string, category?: string): Category {
  if (category === 'sla') return 'sla'
  if (category === 'system') return 'system'
  const t = type || ''
  if (t.includes('sla')) return 'sla'
  if (t.includes('n8n') || t.includes('system')) return 'system'
  if (t.includes('lead') || t.includes('offer') || t.includes('followup') || t.includes('appointment')) return 'leads'
  return 'leads'
}

export function NotificationCenter({ onClose }: { onClose?: () => void }) {
  const { notifications, active, snoozed, unreadCount, markAsRead, markAllAsRead, snooze } = useNotifications()
  const { activeTenantId } = useAuth()
  const [tab, setTab] = React.useState<Category>('all')
  const [customDate, setCustomDate] = React.useState<string>('')
  const { byId: leadById } = useLeadIndex()

  const list = React.useMemo(() => {
    const source = active
    return source.filter(n => tab === 'all' ? true : typeToCategory(n.type, n.category) === tab)
  }, [active, tab])

  const countByTab = React.useMemo(() => {
    const counts: Record<Category, number> = { all: active.length, sla: 0, leads: 0, system: 0 }
    for (const n of active) {
      const c = typeToCategory(n.type, n.category)
      counts[c]++
    }
    return counts
  }, [active])

  const onBulkSnooze = async (preset: '1h'|'4h'|'tomorrow9'|'nextweek'|'custom') => {
    const target = list.map(n => n.id)
    if (preset === 'custom' && !customDate) return
    await Promise.all(target.map(id => snooze(id, preset, preset==='custom'?customDate:undefined)))
  }

  const resolve = async (n: any) => {
    try {
      const type = String(n.type || '')
      const data = n.action_data_json || {}
      // followup_due: complete EFU
      if (type === 'followup_due' && data.efu_id) {
        await supabase.from('enhanced_follow_ups').update({ completed_at: new Date().toISOString() }).eq('id', data.efu_id)
      }
      // appointment_reminder: mark appointment completed
      else if (type === 'appointment_reminder' && data.appointment_id) {
        await supabase.from('appointments').update({ status: 'completed' }).eq('id', data.appointment_id)
      }
      // offer_overdue or SLA offer overdue: create EFU offer_followup today
      else if ((type === 'offer_overdue' || (type === 'sla_breach' && data.kind === 'offer_overdue')) && data.lead_id && activeTenantId) {
        await supabase.from('enhanced_follow_ups').insert({
          tenant_id: activeTenantId as string,
          lead_id: data.lead_id,
          type: 'offer_followup',
          due_date: new Date().toISOString().slice(0,10),
          priority: 'high',
          auto_generated: false,
        })
      }
      // SLA contact overdue: create call EFU today
      else if (type === 'sla_breach' && data.kind === 'contact_overdue' && data.lead_id && activeTenantId) {
        await supabase.from('enhanced_follow_ups').insert({
          tenant_id: activeTenantId as string,
          lead_id: data.lead_id,
          type: 'call',
          due_date: new Date().toISOString().slice(0,10),
          priority: 'high',
          auto_generated: false,
        })
      }
      // default: mark read
    } finally {
      await markAsRead(n.id)
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="font-semibold flex items-center gap-2">
          <span>🔔 Benachrichtigungen</span>
          <span className="text-gray-500">({unreadCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-sm text-blue-600" onClick={()=>markAllAsRead()}>Alle als gelesen</button>
          {onClose && <button className="text-sm text-gray-600" onClick={onClose}>Schließen</button>}
        </div>
      </div>

      <div className="px-3 py-2 border-b flex items-center gap-2 text-sm overflow-x-auto">
        <TabButton label={`Alle (${countByTab.all})`} active={tab==='all'} onClick={()=>setTab('all')} />
        <TabButton label={`SLA (${countByTab.sla})`} active={tab==='sla'} onClick={()=>setTab('sla')} />
        <TabButton label={`Leads (${countByTab.leads})`} active={tab==='leads'} onClick={()=>setTab('leads')} />
        <TabButton label={`System (${countByTab.system})`} active={tab==='system'} onClick={()=>setTab('system')} />
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500">Snooze:</span>
          <BulkBtn onClick={()=>onBulkSnooze('1h')}>1h</BulkBtn>
          <BulkBtn onClick={()=>onBulkSnooze('4h')}>4h</BulkBtn>
          <BulkBtn onClick={()=>onBulkSnooze('tomorrow9')}>Morgen</BulkBtn>
          <BulkBtn onClick={()=>onBulkSnooze('nextweek')}>Nächste Woche</BulkBtn>
          <input type="datetime-local" value={customDate} onChange={e=>setCustomDate(e.target.value)} className="border rounded px-1 py-0.5 text-xs" />
          <BulkBtn onClick={()=>onBulkSnooze('custom')}>Custom</BulkBtn>
        </div>
      </div>

      <ul className="max-h-[60vh] overflow-y-auto divide-y">
        {list.length === 0 && (
          <li className="p-4 text-sm text-gray-500">Keine Benachrichtigungen</li>
        )}
        {list.map(n => (
          <li key={n.id} className="p-3 flex items-start justify-between gap-3 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded ${pillColor(n)}`}>{labelCategory(typeToCategory(n.type, n.category))}</span>
                {n.priority && <span className={`px-2 py-0.5 rounded ${priorityColor(n.priority)}`}>{n.priority}</span>}
                {n.snoozed_until && <span className="text-amber-700">bis {new Date(n.snoozed_until).toLocaleString('de-DE')}</span>}
              </div>
              <div className="font-medium truncate mt-0.5">
                {formatNotificationTitle(n, leadById)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">{new Date(n.created_at).toLocaleString('de-DE')}</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 text-xs">
              <div className="flex items-center gap-1">
                <button className="px-2 py-1 border rounded" onClick={()=>snooze(n.id,'1h')}>1h</button>
                <button className="px-2 py-1 border rounded" onClick={()=>snooze(n.id,'4h')}>4h</button>
                <button className="px-2 py-1 border rounded" onClick={()=>snooze(n.id,'tomorrow9')}>Morgen</button>
                <button className="px-2 py-1 border rounded" onClick={()=>snooze(n.id,'nextweek')}>Nächste Woche</button>
              </div>
              <div className="flex items-center gap-2">
                {maybeCallButton(n)}
                {maybeOpenLead(n)}
                <button className="text-emerald-700" onClick={()=>resolve(n)}>Erledigt</button>
                <button className="text-blue-600" onClick={()=>markAsRead(n.id)}>Als gelesen</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: ()=>void }) {
  return <button className={`px-2 py-1 rounded border text-xs ${active? 'bg-gray-100' : 'bg-white'}`} onClick={onClick}>{label}</button>
}
function BulkBtn({ children, onClick }: { children: React.ReactNode; onClick: ()=>void }) {
  return <button className="px-2 py-1 rounded border text-xs" onClick={onClick}>{children}</button>
}
function labelCategory(c: Category) {
  return c==='sla'?'SLA':c==='leads'?'Leads':c==='system'?'System':'Alle'
}
function pillColor(n: { type?: string; category?: string }) {
  const c = typeToCategory(n.type, n.category)
  if (c==='sla') return 'bg-red-100 text-red-700'
  if (c==='system') return 'bg-gray-100 text-gray-700'
  return 'bg-emerald-100 text-emerald-700'
}
function priorityColor(p?: string) {
  switch (p) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'low': return 'bg-gray-100 text-gray-700'
    default: return 'bg-blue-100 text-blue-800'
  }
}
function maybeCallButton(n: { action_url?: string | null; action_data_json?: { tel?: string } }) {
  const url: string | undefined = n.action_url || (n.action_data_json?.tel as string | undefined)
  if (url && url.startsWith('tel:')) {
    return <a href={url} className="text-emerald-600">Anrufen</a>
  }
  return null
}

function maybeOpenLead(n: { action_data_json?: { lead_id?: string; section?: string }; lead_id?: string }) {
  const leadId: string | undefined = n.action_data_json?.lead_id || n.lead_id
  const section: string | undefined = n.action_data_json?.section
  if (leadId) {
    return <button className="text-gray-700" onClick={()=>openLeadDetail(leadId, section || null)}>Lead öffnen</button>
  }
  return null
}

function formatNotificationTitle(n: any, byId: Map<string, { name: string | null; email: string | null; phone: string | null }>) {
  const leadId = n.action_data_json?.lead_id || n.lead_id
  const name = leadId ? (byId.get(leadId)?.name || byId.get(leadId)?.email || byId.get(leadId)?.phone || leadId?.slice(0,8)) : null
  const t = String(n.type || '')
  if (t === 'followup_due' && name) return `Anruf bei ‘${name}’ fällig`
  if (t === 'appointment_reminder' && name) return `Termin mit ‘${name}’ heute`
  if (t.includes('lead') && name) return `Lead ‘${name}’ wurde aktualisiert`
  return n.title || n.message || 'Benachrichtigung'
}


