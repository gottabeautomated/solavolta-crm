import React from 'react'

export type TaskSource = 'efu' | 'appointment'

export interface TaskCardModel {
  taskId: string
  source: TaskSource
  leadId: string
  tenantId: string
  title: string
  dueAt: string
  priority?: string
  notes?: string | null
}

export interface TaskCardProps {
  task: TaskCardModel
  className?: string
  accent?: 'red' | 'amber' | 'green' | 'default'
  showTime?: boolean
  compact?: boolean
  phone?: string | null
  // actions
  onOpenLead?: (leadId: string) => void
  onCall?: (leadId: string) => void
  onMarkDone?: (taskId: string) => Promise<void> | void
  onSnooze?: (taskId: string, dateISO: string) => Promise<void> | void
  onSaveNote?: (taskId: string, note: string) => Promise<void> | void
  onDelete?: (taskId: string) => Promise<void> | void
}

export function TaskCard({ task, className = '', accent = 'default', showTime, compact, phone, onOpenLead, onCall, onMarkDone, onSnooze, onSaveNote, onDelete }: TaskCardProps) {
  const [note, setNote] = React.useState(task.notes || '')
  const [editing, setEditing] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [offsetX, setOffsetX] = React.useState(0)
  const startX = React.useRef<number | null>(null)

  React.useEffect(() => { setNote(task.notes || '') }, [task.taskId])

  const color = accent === 'red' ? 'border-red-200' : accent === 'amber' ? 'border-amber-200' : accent === 'green' ? 'border-emerald-200' : 'border-gray-200'
  const dot = accent === 'red' ? 'bg-red-500' : accent === 'amber' ? 'bg-amber-500' : accent === 'green' ? 'bg-emerald-500' : 'bg-gray-400'

  const handleSnooze = async (days: number) => {
    if (!onSnooze) return
    const next = new Date()
    next.setDate(next.getDate() + days)
    setBusy(true)
    try { await onSnooze(task.taskId, next.toISOString().slice(0, 10)) } finally { setBusy(false) }
  }

  const handleSaveNote = async () => {
    if (!onSaveNote) { setEditing(false); return }
    setBusy(true)
    try { await onSaveNote(task.taskId, note) } finally { setBusy(false); setEditing(false) }
  }

  // Swipe actions (mobile)
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => { startX.current = e.touches[0].clientX }
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current
    setOffsetX(Math.max(-96, Math.min(96, dx)))
  }
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (Math.abs(offsetX) < 48) setOffsetX(0)
    else setOffsetX(offsetX > 0 ? 96 : -96)
    startX.current = null
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* action reveal area */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        {onDelete && (
          <button
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded shadow"
            onClick={() => onDelete(task.taskId)}
          >🗑️</button>
        )}
        {onMarkDone && (
          <button
            className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded shadow"
            onClick={() => onMarkDone(task.taskId)}
          >✅</button>
        )}
      </div>

      <div
        className={`transition-transform duration-200 ease-out bg-white border ${color} rounded-md p-3 ${busy ? 'opacity-60' : ''}`}
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <span className={`mt-1 inline-block w-2 h-2 rounded-full ${dot}`} />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{task.title}</div>
              <div className="text-xs text-gray-600">
                {showTime ? new Date(task.dueAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : new Date(task.dueAt).toLocaleDateString('de-DE')}
              </div>
              {!compact && (
                <div className="mt-1">
                  {editing ? (
                    <div className="flex items-center gap-2">
                      <input value={note} onChange={(e)=>setNote(e.target.value)} className="flex-1 border rounded px-2 py-1 text-xs" placeholder="Notiz hinzufügen" />
                      <button className="text-xs text-blue-600" onClick={handleSaveNote}>Speichern</button>
                    </div>
                  ) : (
                    <button className="text-xs text-gray-600" onClick={()=>setEditing(true)}>
                      {note ? `📝 ${note}` : '📝 Notiz hinzufügen'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenLead && (
              <button className="text-blue-600 text-xs" onClick={()=>onOpenLead(task.leadId)}>Öffnen</button>
            )}
            {onCall && (
              <button className="text-emerald-600 text-xs" onClick={()=>onCall(task.leadId)}>Anrufen</button>
            )}
            {onSnooze && (
              <div className="relative">
                <details className="group">
                  <summary className="list-none cursor-pointer text-amber-600 text-xs">Verschieben</summary>
                  <div className="absolute right-0 z-10 mt-1 bg-white border rounded shadow p-2 flex items-center gap-2">
                    <button className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={()=>handleSnooze(1)}>+1T</button>
                    <button className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={()=>handleSnooze(3)}>+3T</button>
                    <button className="text-xs px-2 py-1 bg-gray-100 rounded" onClick={()=>handleSnooze(7)}>+7T</button>
                    <input
                      type="date"
                      className="text-xs border rounded px-1 py-0.5"
                      onChange={(e)=>e.target.value && onSnooze(task.taskId, e.target.value)}
                    />
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


