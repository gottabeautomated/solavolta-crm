import React from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from './ui/Modal'

interface Props {
  open: boolean
  leadId: string | null
  onClose: () => void
}

export function FollowUpHistoryModal({ open, leadId, onClose }: Props) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const run = async () => {
      if (!open || !leadId) return
      setLoading(true)
      const { data } = await supabase
        .from('enhanced_follow_ups')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    run()
  }, [open, leadId])

  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-white rounded shadow p-4 w-full max-w-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Follow-up Historie</h3>
          <button className="text-gray-600" onClick={onClose}>Schließen</button>
        </div>
        {loading ? (
          <div className="p-4">Lade…</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-gray-500">Keine Einträge</div>
        ) : (
          <ul className="divide-y mt-2">
            {items.map((it) => (
              <li key={it.id} className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{(it.type==='call' && 'Anruf') || (it.type==='offer_followup' && 'Angebots-Nachfassung') || (it.type==='meeting' && 'Termin') || 'Sonstiges'}</div>
                  <div className="text-xs text-gray-500">{new Date(it.created_at).toLocaleString('de-DE')}</div>
                </div>
                <div className="text-xs text-gray-600">Fällig: {new Date(it.due_date).toLocaleDateString('de-DE')} • Priorität: {it.priority} • Auto: {it.auto_generated ? 'Ja' : 'Nein'} • Esc L{it.escalation_level||0}</div>
                {it.notes && <div className="text-gray-700 mt-1">{it.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}


