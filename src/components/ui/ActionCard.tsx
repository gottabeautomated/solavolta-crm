import React from 'react'
import { useLeadIndex } from '../../hooks/useLeadIndex'

export interface ActionTask {
  id: string
  leadId: string
  title: string
  dueAt: string
  priority: 'urgent' | 'high' | 'normal' | 'low' | 'overdue' | string
  source: 'efu' | 'appointment'
  notes?: string | null
}

export function ActionCard({ task, variant = 'normal', onOpenLead }: { task: ActionTask; variant?: 'urgent' | 'normal'; onOpenLead?: (id: string) => void }) {
  const { byId } = useLeadIndex()
  const lead = byId.get(task.leadId)
  const isUrgent = variant === 'urgent' || task.priority === 'overdue' || task.priority === 'high'
  const overdue = new Date(task.dueAt).getTime() < Date.now()

  const bg = isUrgent ? 'border-red-300' : 'border-gray-200'

  const icon = task.source === 'appointment' ? '📅' : isCall(task) ? '📞' : isOfferFollowup(task) ? '📄' : '📝'
  const step = getNextStep(task, lead?.lead_status || null)
  const cta = getCta(step)

  const formatDistance = (iso: string) => {
    const d = new Date(iso).getTime()
    const now = Date.now()
    const diff = Math.abs(now - d)
    const days = Math.floor(diff / (24*60*60*1000))
    if (days >= 1) return `${days} Tag${days>1?'e':''}`
    const hours = Math.floor((diff % (24*60*60*1000)) / (60*60*1000))
    if (hours >= 1) return `${hours} Std.`
    const mins = Math.floor((diff % (60*60*1000)) / (60*1000))
    return `${mins} Min.`
  }

  return (
    <div className={`border-2 rounded-lg p-4 bg-white ${bg} hover:shadow-sm transition-shadow`}>
      {/* Chips-Zeile */}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${isUrgent?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}>Nächster Schritt: {step}</span>
        <span className={`px-2 py-0.5 rounded text-xs ${overdue?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800'}`}>{overdue ? `Überfällig ${formatDistance(task.dueAt)}` : 'Heute'}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xl">{icon}</span>
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">{lead?.name || 'Unbekannter Lead'}</div>
              {lead?.phone && <div className="text-sm text-gray-600 truncate">📱 {lead.phone}</div>}
            </div>
          </div>
          <div className="text-sm text-gray-700 truncate">{formatTaskTitle(task)}</div>
          {lead?.lead_status && (
            <div className="text-xs text-gray-600 mt-0.5">Status: {lead.lead_status}</div>
          )}
          {task.notes && (
            <div className="text-xs text-gray-500 mt-1 truncate">Hinweis: {task.notes}</div>
          )}
          {overdue && (
            <div className="text-xs text-red-600 mt-1 font-medium">⏰ {formatDistance(task.dueAt)} überfällig</div>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {lead?.phone && (
            <button title="Jetzt anrufen" onClick={() => window.open(`tel:${lead.phone}`)} className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700">📞 {step==='Anrufen' ? 'Jetzt anrufen' : 'Anrufen'}</button>
          )}
          <button onClick={() => onOpenLead?.(task.leadId)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700">{cta}</button>
        </div>
      </div>
    </div>
  )
}

function formatTaskTitle(task: { title: string; source: string }) {
  const map: Record<string, string> = {
    call: 'Rückruf erforderlich',
    offer_followup: 'Angebot nachfassen',
    meeting: 'Termin wahrnehmen',
    custom: 'Aufgabe',
    offer: 'Angebot',
  }
  if (task.source === 'appointment') return 'Termin wahrnehmen'
  return map[task.title as keyof typeof map] || task.title
}

function getNextStep(task: ActionTask, leadStatus: string | null): 'Anrufen'|'Angebot nachfassen'|'Termin wahrnehmen'|'Aufgabe' {
  if (task.source === 'appointment') return 'Termin wahrnehmen'
  if (isCall(task)) return 'Anrufen'
  if (isOfferFollowup(task)) return 'Angebot nachfassen'
  // Fallback anhand Lead-Status
  const s = (leadStatus || '').toLowerCase()
  if (['neu','kontaktiert','nicht erreicht 1x','nicht erreicht 2x','nicht erreicht 3x'].some(x=>s.includes(x))) return 'Anrufen'
  if (['termin vereinbart'].some(x=>s.includes(x))) return 'Termin wahrnehmen'
  if (['angebot übermittelt','in überlegung'].some(x=>s.includes(x))) return 'Angebot nachfassen'
  return 'Aufgabe'
}

function getCta(step: 'Anrufen'|'Angebot nachfassen'|'Termin wahrnehmen'|'Aufgabe') {
  if (step === 'Anrufen') return 'Jetzt anrufen'
  if (step === 'Angebot nachfassen') return 'Jetzt nachfassen'
  if (step === 'Termin wahrnehmen') return 'Zum Termin'
  return 'Öffnen'
}

function isCall(task: ActionTask) { return task.title === 'call' || /anruf|call/i.test(task.title) }
function isOfferFollowup(task: ActionTask) { return task.title === 'offer_followup' || /angebot/i.test(task.title) }


