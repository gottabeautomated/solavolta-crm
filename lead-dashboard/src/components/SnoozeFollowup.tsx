import React, { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import type { Lead } from '../types/leads'

interface SnoozeFollowupProps {
  lead: Lead
  onSnooze?: (newDate: string) => void
}

export function SnoozeFollowup({ lead, onSnooze }: SnoozeFollowupProps) {
  const { updateLead } = useLeads()
  const [isSnoozing, setIsSnoozing] = useState(false)
  const [show, setShow] = useState(false)

  const options = [
    { label: '1 Tag', days: 1 },
    { label: '3 Tage', days: 3 },
    { label: '1 Woche', days: 7 },
    { label: '2 Wochen', days: 14 },
    { label: '1 Monat', days: 30 },
  ]

  const handleSnooze = async (days: number) => {
    setIsSnoozing(true)
    try {
      const newDate = new Date()
      newDate.setDate(newDate.getDate() + days)
      const dateStr = newDate.toISOString().split('T')[0]
      const { error } = await updateLead({ id: lead.id, follow_up_date: dateStr })
      if (error) throw new Error(error.message)
      onSnooze?.(dateStr)
      setShow(false)
    } catch (e) {
      if (import.meta.env.DEV) console.error(e)
      alert('Fehler beim Verschieben des Follow-ups')
    } finally {
      setIsSnoozing(false)
    }
  }

  if (!lead.follow_up) return null

  return (
    <div className="relative inline-block">
      <button onClick={() => setShow(!show)} disabled={isSnoozing} className="text-sm text-gray-600 hover:text-gray-800">
        {isSnoozing ? '⏳ Verschiebe...' : '⏰ Verschieben'}
      </button>
      {show && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-40 z-10">
          {options.map((o) => (
            <button key={o.days} onClick={() => handleSnooze(o.days)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50">
              {o.label}
            </button>
          ))}
          <hr className="my-2" />
          <button onClick={() => setShow(false)} className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50">
            Abbrechen
          </button>
        </div>
      )}
    </div>
  )
}


