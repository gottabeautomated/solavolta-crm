import React from 'react'
import { useEnhancedFollowUps } from '../hooks/useEnhancedFollowUps'
import { EnhancedFollowUpForm } from './EnhancedFollowUpForm'
import { useDashboard } from '../contexts/DashboardContext'
import { FollowUpHistoryModal } from './FollowUpHistoryModal'

interface Props {
  onOpenLead?: (leadId: string) => void
}

export function EnhancedFollowUpsPanel({ onOpenLead }: Props) {
  const { overdue, today, next7, loading, error, markCompleted, create, update, refetch } = useEnhancedFollowUps()
  const { filters, setFilters } = useDashboard()
  const [showForm, setShowForm] = React.useState(false)
  const [editItem, setEditItem] = React.useState<any | null>(null)
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [historyLead, setHistoryLead] = React.useState<string | null>(null)

  if (loading) return <div className="p-4">Lade Enhanced Follow-ups…</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>

  const Section = ({ title, items }: { title: string; items: any[] }) => {
    // CRITICAL: Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : []
    
    return (
      <div className="bg-white rounded border shadow-sm">
        <div className="px-4 py-2 font-semibold border-b flex items-center justify-between">
          <span>{title} ({safeItems.length})</span>
        <div className="flex items-center gap-2">
          {title === 'Heute' && (
            <button className="text-blue-600 text-sm" onClick={() => { setEditItem(null); setShowForm(true) }}>Neu</button>
          )}
          {/* Bulk Actions */}
          <details className="relative">
            <summary className="list-none text-sm text-gray-600 cursor-pointer">Aktionen</summary>
            <div className="absolute right-0 z-10 mt-1 bg-white border rounded shadow p-2 flex items-center gap-2">
              <button className="text-xs px-2 py-1 bg-emerald-100 rounded" onClick={async()=>{ await Promise.all(Object.keys(selected).filter(k=>selected[k]).map(id=>markCompleted(id))); setSelected({}); refetch() }}>Erledigt</button>
              <button className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={()=>alert('Verschieben via Datumsfeld pro Eintrag – später als Bulk möglich')}>Verschieben</button>
              <button className="text-xs px-2 py-1 bg-red-100 rounded" onClick={()=>setSelected({})}>Auswahl aufheben</button>
            </div>
          </details>
        </div>
      </div>
      {safeItems.length === 0 ? (
        <div className="p-4 text-gray-500">Keine Einträge</div>
      ) : (
        <ul className="divide-y">
          {safeItems.filter(it => it != null).map((it) => (
            <li key={it?.id || Math.random()} className="p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input type="checkbox" checked={!!selected[it.id]} onChange={(e)=>setSelected(s=>({ ...s, [it.id]: e.target.checked }))} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2 truncate">
                    {(it.type === 'call' && 'Anruf') || (it.type === 'offer_followup' && 'Angebots-Nachfassung') || (it.type === 'meeting' && 'Termin') || 'Sonstiges'}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${it.auto_generated ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>{it.auto_generated ? 'Auto' : 'Manual'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${it.escalation_level>=2?'bg-red-100 text-red-700':it.escalation_level===1?'bg-amber-100 text-amber-700':'bg-emerald-100 text-emerald-700'}`}>Esc L{it.escalation_level||0}</span>
                  </div>
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <input
                      type="date"
                      value={it?.due_date ? String(it.due_date).slice(0,10) : ''}
                      onChange={async(e)=>{ await update(it.id, { due_date: e.target.value }); refetch() }}
                      className="text-xs border rounded px-1 py-0.5"
                    />
                    <span className={`px-2 py-0.5 rounded text-[10px] ${it.priority==='overdue'?'bg-red-100 text-red-700':it.priority==='high'?'bg-amber-100 text-amber-700':it.priority==='medium'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}`}>{it.priority}</span>
                  </div>
                  {it.notes && <div className="text-gray-600 truncate">{it.notes}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-blue-600" onClick={() => onOpenLead?.(it.lead_id)}>Lead</button>
                <button className="text-gray-600" onClick={()=>setHistoryLead(it.lead_id)}>Historie</button>
                <button className="text-gray-600" onClick={() => { setEditItem(it); setShowForm(true) }}>Bearbeiten</button>
                <button className="text-green-600" onClick={() => markCompleted(it.id)}>Erledigt</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filterleiste */}
      <div className="flex items-center gap-2">
        <select value={filters.onlyToday ? 'today' : 'all'} onChange={(e)=>setFilters({ onlyToday: e.target.value==='today' })} className="text-sm border rounded px-2 py-1">
          <option value="all">Alle</option>
          <option value="today">Heute</option>
        </select>
        <select value={filters.showCompleted ? 'all' : 'open'} onChange={(e)=>setFilters({ showCompleted: e.target.value==='all' })} className="text-sm border rounded px-2 py-1">
          <option value="open">Offen</option>
          <option value="all">Alle</option>
        </select>
        <input value={filters.search} onChange={(e)=>setFilters({ search: e.target.value })} placeholder="Suchen…" className="text-sm border rounded px-2 py-1 flex-1" />
      </div>

      <Section title="Überfällig" items={overdue} />
      <Section title="Heute" items={today} />
      <Section title="Nächste 7 Tage" items={next7} />
      <EnhancedFollowUpForm
        open={showForm}
        initial={editItem}
        onClose={() => setShowForm(false)}
        onSave={async (payload) => {
          if ((payload as any).id) {
            const { id, ...rest } = payload as any
            await update(id, rest)
          } else {
            await create(payload as any)
          }
          await refetch()
        }}
      />
      <FollowUpHistoryModal open={!!historyLead} leadId={historyLead} onClose={()=>setHistoryLead(null)} />
    </div>
  )
}


