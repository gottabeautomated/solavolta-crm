import React from 'react'
import { useDashboard } from '../contexts/DashboardContext'
import { useSavedViews, type SavedViewFilters } from '../hooks/useSavedViews'
import { useDebounce } from '../hooks/useDebounce'

export function SmartFilters() {
  const { filters, setFilters, clearFilters, addSearchHistory, getSearchHistory } = useDashboard()
  const { views, predefined, activeViewId, setActiveViewId, activeView } = useSavedViews()
  const [openPanel, setOpenPanel] = React.useState(false)
  const [q, setQ] = React.useState(filters.search || '')
  const debounced = useDebounce(q, 300)

  React.useEffect(() => {
    setFilters({ search: debounced })
    if (debounced) addSearchHistory(debounced)
  }, [debounced])

  const history = getSearchHistory()

  const applySavedFilters = (sv: SavedViewFilters) => {
    setFilters({
      logic: sv.logic ?? 'AND',
      zipRanges: sv.zipRanges ?? [],
      roofTypes: sv.roofTypes ?? [],
      priorities: sv.priorities ?? [],
      owners: sv.owners ?? [],
      onlyToday: sv.onlyToday ?? false,
    })
  }

  React.useEffect(() => {
    if (activeView && activeView.filters_json) {
      applySavedFilters(activeView.filters_json as SavedViewFilters)
    }
  }, [activeView?.id])

  const addZip = (from: string, to?: string) => setFilters({ zipRanges: [...filters.zipRanges, { from, to: to ?? from }] })
  const removeZip = (idx: number) => setFilters({ zipRanges: filters.zipRanges.filter((_, i) => i !== idx) })
  const toggleRoof = (val: string) => setFilters({ roofTypes: filters.roofTypes.includes(val) ? filters.roofTypes.filter(v => v !== val) : [...filters.roofTypes, val] })
  const togglePriority = (val: 'low'|'medium'|'high'|'overdue') => setFilters({ priorities: filters.priorities.includes(val) ? filters.priorities.filter(v => v !== val) : [...filters.priorities, val] })

  const Chip = ({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) => (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs mr-2 mb-2">
      {children}
      <button onClick={onRemove} className="text-gray-500 hover:text-gray-700">✕</button>
    </span>
  )

  const predefinedNames = React.useMemo(() => new Set(predefined.map(p => p.name.toLowerCase())), [predefined])
  const userViews = React.useMemo(() => views.filter(v => !predefinedNames.has((v.name || '').toLowerCase())), [views, predefinedNames])

  return (
    <div className="bg-white border rounded p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <input id="smart-search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Schnellsuche…" className="border rounded px-3 py-2 w-64" />
          {history.length>0 && q==='' && (
            <div className="absolute mt-1 bg-white border rounded shadow text-sm w-full z-10">
              {history.map((h)=> (
                <button key={h} className="block w-full text-left px-3 py-1.5 hover:bg-gray-50" onClick={()=>setQ(h)}>{h}</button>
              ))}
            </div>
          )}
        </div>

        <ZipMenu onAdd={addZip} />
        <RoofMenu selected={filters.roofTypes} onToggle={toggleRoof} />
        <PriorityMenu selected={filters.priorities} onToggle={togglePriority} />

        <button className="ml-auto px-3 py-2 border rounded md:hidden" onClick={()=>setOpenPanel(true)}>Filter</button>
      </div>

      <div className="mt-2 flex items-center gap-2 overflow-x-auto">
        <Tabs views={userViews} predefined={predefined} activeId={activeViewId} onChange={setActiveViewId} onApplyPredefined={(f)=>{ applySavedFilters(f); setActiveViewId(null) }} />
      </div>

      <div className="mt-2 flex items-center flex-wrap">
        {filters.zipRanges.map((z, i) => (<Chip key={`z${i}`} onRemove={()=>removeZip(i)}>{z.from}{z.to!==z.from?`–${z.to}`:''}</Chip>))}
        {filters.roofTypes.map((r, i) => (<Chip key={`r${i}`} onRemove={()=>toggleRoof(r)}>{r}</Chip>))}
        {filters.priorities.map((p, i) => (<Chip key={`p${i}`} onRemove={()=>togglePriority(p as any)}>{labelPrio(p)}</Chip>))}
        {(filters.zipRanges.length+filters.roofTypes.length+filters.priorities.length>0 || filters.search) && (
          <button className="text-sm text-blue-600 ml-2" onClick={clearFilters}>Filter löschen</button>
        )}
      </div>

      {openPanel && (
        <div className="fixed inset-0 z-[3000]">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setOpenPanel(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-lg p-4">
            <h3 className="font-semibold mb-2">Filter</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">PLZ</div>
                <ZipMenu onAdd={addZip} compact />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Dachtyp</div>
                <RoofMenu selected={filters.roofTypes} onToggle={toggleRoof} compact />
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Priorität</div>
                <PriorityMenu selected={filters.priorities} onToggle={togglePriority} compact />
              </div>
              <button className="w-full px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>setOpenPanel(false)}>Fertig</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Tabs({ views, predefined, activeId, onChange, onApplyPredefined }: { views: any[]; predefined: {name:string;filters: SavedViewFilters}[]; activeId: string | null; onChange: (id:string|null)=>void; onApplyPredefined: (filters: SavedViewFilters)=>void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      <button className={`px-3 py-1.5 rounded border ${activeId? 'text-gray-600' : 'bg-gray-100'}`} onClick={()=>onChange(null)}>Alle</button>
      {predefined.map(p => (
        <button key={p.name} className={`px-3 py-1.5 rounded border bg-white text-gray-700`} onClick={()=>onApplyPredefined(p.filters)}>{p.name}</button>
      ))}
      {views.map(v => (
        <button key={v.id} className={`px-3 py-1.5 rounded border ${activeId===v.id? 'bg-gray-100' : 'bg-white'}`} onClick={()=>onChange(v.id)}>{v.name}</button>
      ))}
    </div>
  )
}

function ZipMenu({ onAdd, compact }: { onAdd: (from: string, to?: string)=>void; compact?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [from, setFrom] = React.useState('')
  const [to, setTo] = React.useState('')
  const ref = React.useRef<HTMLDivElement|null>(null)
  React.useEffect(()=>{
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc)
  },[])
  return (
    <div className="relative" ref={ref}>
      <button className="px-2 py-2 border rounded" onClick={()=>setOpen(o=>!o)}>📍 PLZ</button>
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow p-3 w-64">
          <div className="flex items-center gap-2">
            <input value={from} onChange={(e)=>setFrom(e.target.value)} placeholder="von" className="border rounded px-2 py-1 w-24" />
            <input value={to} onChange={(e)=>setTo(e.target.value)} placeholder="bis" className="border rounded px-2 py-1 w-24" />
            <button className="px-2 py-1 bg-blue-600 text-white rounded" onClick={()=>{ if(from){ onAdd(from,to||undefined); setFrom(''); setTo(''); setOpen(false) } }}>Hinzufügen</button>
          </div>
          {!compact && (
            <div className="text-xs text-gray-600 mt-2">Tipp: nur eine PLZ für exakte Suche.</div>
          )}
        </div>
      )}
    </div>
  )
}

function RoofMenu({ selected, onToggle, compact }: { selected: string[]; onToggle: (v:string)=>void; compact?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement|null>(null)
  React.useEffect(()=>{
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc)
  },[])
  const options = ['Ziegel','Blech','Flachdach','Sonstiges']
  return (
    <div className="relative" ref={ref}>
      <button className="px-2 py-2 border rounded" onClick={()=>setOpen(o=>!o)}>🏠 Dach</button>
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow p-2 w-44">
          {options.map(o => (
            <label key={o} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(o)} onChange={()=>onToggle(o)} />
              <span>{o}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function PriorityMenu({ selected, onToggle, compact }: { selected: ('low'|'medium'|'high'|'overdue')[]; onToggle: (v:any)=>void; compact?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement|null>(null)
  React.useEffect(()=>{
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc)
  },[])
  const options: {v:'low'|'medium'|'high'|'overdue';l:string}[] = [
    { v:'low', l:'Niedrig' }, { v:'medium', l:'Mittel' }, { v:'high', l:'Hoch' }, { v:'overdue', l:'Überfällig' }
  ]
  return (
    <div className="relative" ref={ref}>
      <button className="px-2 py-2 border rounded" onClick={()=>setOpen(o=>!o)}>⭐ Prio</button>
      {open && (
        <div className="absolute z-10 bg-white border rounded shadow p-2 w-44">
          {options.map(o => (
            <label key={o.v} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50">
              <input type="checkbox" checked={selected.includes(o.v)} onChange={()=>onToggle(o.v)} />
              <span>{o.l}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function labelPrio(p: string) { return p==='low'?'Niedrig':p==='medium'?'Mittel':p==='high'?'Hoch':'Überfällig' }


