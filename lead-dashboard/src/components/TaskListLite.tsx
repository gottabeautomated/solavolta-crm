import React from 'react'
import type { TodayTask, OverdueTask } from '../types/dashboard'
import { useDashboard } from '../contexts/DashboardContext'
import { useLeadIndex } from '../hooks/useLeadIndex'
import { supabase } from '../lib/supabase'

type LiteTask = TodayTask | OverdueTask

interface TaskListLiteProps {
  tasks: LiteTask[]
  onOpenLead?: (leadId: string) => void
  className?: string
  estimatedRowHeight?: number
}

export function TaskListLite({ tasks, onOpenLead, className, estimatedRowHeight = 60 }: TaskListLiteProps) {
  const { completeTask, rescheduleTask } = useDashboard()
  const { byId: leadById } = useLeadIndex()
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [swipedId, setSwipedId] = React.useState<string | null>(null)

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [viewport, setViewport] = React.useState({ height: 480, scrollTop: 0 })

  const onScroll = () => {
    const el = containerRef.current
    if (!el) return
    setViewport({ height: el.clientHeight, scrollTop: el.scrollTop })
  }

  function formatTaskType(title: string) {
    const map: Record<string, string> = {
      call: 'Anruf',
      offer_followup: 'Angebots-Nachfassung',
      meeting: 'Termin',
      custom: 'Aufgabe',
      offer: 'Angebot',
      followup: 'Follow-up',
      tvp: 'TVP'
    }
    // wenn title ein bekannter Typ ist, nutze Mapping, sonst gib original aus
    return map[title as keyof typeof map] || title
  }

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setViewport({ height: el.clientHeight, scrollTop: el.scrollTop })
  }, [])

  const totalHeight = tasks.length * estimatedRowHeight
  const startIndex = Math.max(0, Math.floor(viewport.scrollTop / estimatedRowHeight) - 5)
  const visibleCount = Math.ceil(viewport.height / estimatedRowHeight) + 10
  const endIndex = Math.min(tasks.length, startIndex + visibleCount)
  const offsetY = startIndex * estimatedRowHeight
  const visibleTasks = tasks.slice(startIndex, endIndex)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const bulkDone = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      await completeTask(id, 'efu')
    }
    clearSelection()
  }

  const bulkSnooze = async (days: number) => {
    const ids = Array.from(selected)
    const dateISO = new Date(Date.now() + days*24*60*60*1000).toISOString().slice(0,10)
    for (const id of ids) {
      await rescheduleTask(id, 'efu', dateISO)
    }
  }

  const callLead = async (leadId: string) => {
    const { data } = await supabase.from('leads').select('phone').eq('id', leadId).single()
    if (data?.phone) window.open(`tel:${data.phone}`)
    else if (onOpenLead) onOpenLead(leadId)
  }

  const onTouchStart = React.useRef<{ id: string; x: number } | null>(null)
  const handleTouchStart = (id: string) => (e: React.TouchEvent) => {
    onTouchStart.current = { id, x: e.touches[0].clientX }
  }
  const handleTouchMove = (id: string) => (e: React.TouchEvent) => {
    const start = onTouchStart.current
    if (!start || start.id !== id) return
    const dx = e.touches[0].clientX - start.x
    if (dx < -30) setSwipedId(id)
    if (dx > 20 && swipedId === id) setSwipedId(null)
  }

  const renderCountdown = (dueAt: string) => {
    const due = new Date(dueAt)
    const today = new Date()
    const diffDays = Math.floor((due.setHours(0,0,0,0) - today.setHours(0,0,0,0)) / (24*60*60*1000))
    if (diffDays < 0) return `T${diffDays}` // e.g., T-3
    if (diffDays === 0) return 'Heute'
    return `+${diffDays}d`
  }

  const colorDot = (dueAt: string) => {
    const due = new Date(dueAt)
    const today = new Date()
    const diffDays = Math.floor((due.setHours(0,0,0,0) - today.setHours(0,0,0,0)) / (24*60*60*1000))
    if (diffDays < 0) return '🔴'
    if (diffDays === 0) return '🟡'
    return '🟢'
  }

  const [focusedIndex, setFocusedIndex] = React.useState<number>(0)

  // Expose keyboard handlers to parent via ref (optional)
  // Parent can pass a ref by capturing this component instance
  // For simplicity, we attach methods on window symbol (lightweight)
  ;(window as any).__taskListLite = {
    focusFirst: () => setFocusedIndex(0),
    focusNext: () => setFocusedIndex(i => Math.min(tasks.length - 1, i + 1)),
    focusPrev: () => setFocusedIndex(i => Math.max(0, i - 1)),
    toggleCurrent: () => { const id = tasks[focusedIndex]?.taskId; if (id) toggleSelect(id) },
    openCurrent: () => { const t = tasks[focusedIndex]; if (t && onOpenLead) onOpenLead(t.leadId) },
  }

  return (
    <div className={className || ''}>
      {selected.size > 0 && (
        <div className="sticky bottom-2 z-20 mx-2 mb-2 rounded-lg border bg-white shadow flex items-center gap-2 px-3 py-2 text-sm">
          <span>📋 {selected.size} ausgewählt</span>
          <button className="px-2 py-1 rounded border" onClick={bulkDone}>✅ Alle</button>
          <button className="px-2 py-1 rounded border" onClick={()=>bulkSnooze(1)}>⏰ +1d</button>
          <button className="px-2 py-1 rounded border" onClick={()=>bulkSnooze(3)}>⏰ +3d</button>
          <button className="px-2 py-1 rounded border" onClick={()=>bulkSnooze(7)}>⏰ +7d</button>
          <button className="ml-auto text-gray-600" onClick={clearSelection}>Abwählen</button>
        </div>
      )}

      <div ref={containerRef} onScroll={onScroll} className="max-h-[70vh] overflow-auto border rounded">
        <div style={{ height: totalHeight }} className="relative">
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleTasks.map((t, idx) => (
              <div key={t.taskId}
                   className="relative border-b bg-white"
                   style={{ height: estimatedRowHeight }}
                   onTouchStart={handleTouchStart(t.taskId)}
                   onTouchMove={handleTouchMove(t.taskId)}
              >
                <div className={`absolute inset-0 flex items-center px-3 gap-3 ${tasks.indexOf(t)===focusedIndex? 'ring-1 ring-blue-300' : ''}`}>
                  <input type="checkbox" checked={selected.has(t.taskId)} onChange={()=>toggleSelect(t.taskId)} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {colorDot(t.dueAt)} {formatTaskType(t.title)} —
                      <span className="text-gray-700">
                        {' '}{leadById.get(t.leadId)?.name || leadById.get(t.leadId)?.email || leadById.get(t.leadId)?.phone || t.leadId.slice(0,8)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {renderCountdown(t.dueAt)}
                      {t.source === 'efu' && t.notes ? ` • Notiz: ${t.notes}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button title="Anrufen" className="text-emerald-600 text-sm" onClick={()=>callLead(t.leadId)}>📞</button>
                    <button title="Erledigt" className="text-blue-600 text-sm" onClick={()=>completeTask(t.taskId, 'efu')}>✅</button>
                    <button title="+1 Tag" className="text-amber-600 text-sm" onClick={()=>rescheduleTask(t.taskId, 'efu', new Date(Date.now() + 24*60*60*1000).toISOString().slice(0,10))}>⏰</button>
                  </div>
                </div>
                {swipedId === t.taskId && (
                  <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3 bg-white/90">
                    <button className="px-2 py-1 text-emerald-700 border rounded" onClick={()=>callLead(t.leadId)}>Anrufen</button>
                    <button className="px-2 py-1 text-blue-700 border rounded" onClick={()=>completeTask(t.taskId, 'efu')}>Erledigt</button>
                    <button className="px-2 py-1 text-amber-700 border rounded" onClick={()=>rescheduleTask(t.taskId, 'efu', new Date(Date.now() + 3*24*60*60*1000).toISOString().slice(0,10))}>+3d</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


