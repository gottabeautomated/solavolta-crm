import React from 'react'
import { useKpiData } from '../hooks/useKpiData'
import { useSlaAlerts } from '../hooks/useSlaAlerts'
import { useSavedViews } from '../hooks/useSavedViews'
import { SaveViewDialog } from './SaveViewDialog'

export function KpiBar() {
  const { kpis, sla, rev, loading } = useKpiData()
  const { alerts, loading: la } = useSlaAlerts()
  const { views, predefined, setDefault, create, update, remove, activeViewId, setActiveViewId, activeView } = useSavedViews()
  const [showSave, setShowSave] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  if (loading || la) return <div className="grid grid-cols-1 gap-3">{Array.from({length:1}).map((_,i)=>(<div key={i} className="h-16 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse rounded-xl shadow-sm" />))}</div>
  const leadsToday = kpis?.leads_today ?? 0
  const fusToday = (kpis?.fu_due_today ?? 0)
  const apptToday = kpis?.appt_today ?? 0
  const slaContact = sla?.sla_contacted_pct ?? 0
  const pipeline = rev?.gross_estimate ?? 0
  const trend = (slaContact - 80) // fake basis für Trend; später mit Vorwoche ersetzen
  const trendIcon = trend >= 0 ? '↗' : '↘'

  return (
    <div className="rounded-xl bg-white shadow-sm border p-4">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📊 Heute:</span>
          <strong>{leadsToday} Leads</strong>
          <span className="text-gray-400">|</span>
          <strong>{fusToday} FUs</strong>
          <span className="text-gray-400">|</span>
          <strong>{apptToday} Termine</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">SLA:</span>
          <SlaPill pct={slaContact} tooltip="Erstkontakt < 24h" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">💰 Pipeline:</span>
          <strong>{formatCurrency(pipeline)}</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Trend:</span>
          <strong className={trend>=0?'text-emerald-600':'text-red-600'}>{Math.abs(trend).toFixed(0)}% {trendIcon}</strong>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button className="px-2 py-1 border rounded" title="View speichern" onClick={()=>setShowSave(true)}>Speichern</button>
          <ViewPicker views={views} activeId={activeViewId} onChange={setActiveViewId} predefined={predefined} onCreate={create} onSetDefault={setDefault} onRename={async (id, name)=>update(id, { name })} onDelete={async (id)=>remove(id)} />
          <AlertBadge count={alerts.length} />
        </div>
      </div>
      <SaveViewDialog open={showSave} onClose={()=>setShowSave(false)} />
    </div>
  )
}

function Kpi({ title, value, danger, raw }: { title: string; value: number | string; danger?: boolean; raw?: boolean }) {
  return (
    <div className={`p-3 rounded border ${danger ? 'border-red-200' : 'border-gray-200'} bg-white`}> 
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold">{raw ? value : typeof value === 'number' ? value.toLocaleString('de-DE') : value}</div>
    </div>
  )
}

function Sla({ title, pct }: { title: string; pct: number }) {
  const color = pct >= 90 ? 'bg-emerald-100 text-emerald-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return (
    <div className={`p-3 rounded border border-gray-200 bg-white`}>
      <div className="text-xs text-gray-500">{title}</div>
      <div className={`inline-block mt-1 px-2 py-1 rounded text-sm ${color}`}>{pct.toFixed(1)}%</div>
    </div>
  )
}

function SlaPill({ pct, tooltip }: { pct: number; tooltip?: string }) {
  const color = pct >= 90 ? 'bg-emerald-100 text-emerald-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`px-2 py-0.5 rounded text-sm ${color}`} title={tooltip}>{pct.toFixed(1)}%</span>
  )
}

function AlertBadge({ count }: { count: number }) {
  const color = count === 0 ? 'bg-emerald-100 text-emerald-700' : count < 3 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`px-2 py-0.5 rounded text-sm ${color}`} title="SLA Alerts">⚠️ {count}</span>
  )
}

function ViewPicker({ views, activeId, onChange, predefined, onCreate, onSetDefault, onRename, onDelete }: { views: any[]; activeId: string | null; onChange: (id:string|null)=>void; predefined: {name:string;filters:any}[]; onCreate: (n:string,f:any,def?:boolean)=>Promise<any>; onSetDefault: (id:string)=>Promise<void>; onRename: (id:string, name:string)=>Promise<any>; onDelete: (id:string)=>Promise<any> }) {
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="flex items-center gap-2 text-sm" ref={menuRef}>
      <select className="border rounded px-2 py-1" value={activeId || ''} onChange={(e)=>onChange(e.target.value || null)}>
        <option value="">Alle</option>
        {[...views.filter(v=>v.is_default), ...views.filter(v=>!v.is_default)].map(v => (
          <option key={v.id} value={v.id}>{v.name}{v.is_default ? ' ★' : ''}</option>
        ))}
      </select>
      <div className="relative">
        <button className="px-2 py-1 border rounded" onClick={() => setOpen(o=>!o)}>Views</button>
        {open && (
          <div className="absolute right-0 mt-2 bg-white border rounded shadow text-left min-w-[220px] z-10">
            <div className="px-3 py-2 font-semibold">Vordefiniert</div>
            {predefined.map((p) => (
              <button key={p.name} className="w-full text-left px-3 py-1.5 hover:bg-gray-50" onClick={async () => { await onCreate(p.name, p.filters); setOpen(false) }}>{p.name}</button>
            ))}
            <div className="h-px bg-gray-200 my-1" />
            <div className="px-3 py-2 text-xs text-gray-600">Meine Views</div>
            {views.map(v => (
              <div key={v.id} className="px-3 py-1.5 hover:bg-gray-50">
                {editingId === v.id ? (
                  <div className="flex items-center gap-2">
                    <input value={editName} onChange={(e)=>setEditName(e.target.value)} className="border rounded px-2 py-1 w-full" />
                    <button className="text-emerald-600" onClick={async ()=>{ await onRename(v.id, editName.trim() || v.name); setEditingId(null); setOpen(false) }}>OK</button>
                    <button className="text-gray-600" onClick={()=>setEditingId(null)}>Abbr.</button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span>{v.name}</span>
                    <div className="flex items-center gap-2">
                      {!v.is_default && (
                        <button className="text-blue-600" onClick={async () => { await onSetDefault(v.id); setOpen(false) }}>Als Default</button>
                      )}
                      <button className="text-gray-700" onClick={()=>{ setEditingId(v.id); setEditName(v.name) }}>Umben.</button>
                      <button className="text-red-600" onClick={async ()=>{ await onDelete(v.id); setOpen(false) }}>Löschen</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatCurrency(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) }


