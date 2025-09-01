import React, { useState } from 'react'
import { useAppointments } from '../hooks/useAppointments'

interface AppointmentFormProps {
  leadId: string
  leadName: string
  onSuccess?: (result: any) => void
  onCancel?: () => void
}

export function AppointmentForm({ leadId, leadName, onSuccess, onCancel }: AppointmentFormProps) {
  const { isCreating, lastResult, createLocalAppointment, triggerAppointmentWebhook, generateTimeSlots, isValidAppointmentDate } = useAppointments()

  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [notes, setNotes] = useState('')

  const timeSlots = generateTimeSlots()
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointmentDate || !appointmentTime) {
      alert('Bitte Datum und Uhrzeit auswählen')
      return
    }
    if (!isValidAppointmentDate(appointmentDate)) {
      alert('Bitte ein Datum in der Zukunft wählen')
      return
    }
    // 1) Direkt in Supabase speichern
    const result = await createLocalAppointment(leadId, appointmentDate, appointmentTime, notes)
    if (result.success) onSuccess?.(result)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Termin vereinbaren mit {leadName}</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
          <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={today} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Uhrzeit</label>
          <select value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Uhrzeit wählen</option>
            {timeSlots.map((t) => (
              <option key={t} value={t}>{t} Uhr</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notizen (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Zusätzliche Informationen zum Termin..." />
        </div>

        {lastResult && (
          <div className={`p-3 rounded ${lastResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {lastResult.success ? (
              <div>✅ Termin erfolgreich erstellt!</div>
            ) : (
              <div>❌ Fehler: {lastResult.error}</div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-3">
            <button type="submit" disabled={isCreating} className={`flex-1 px-4 py-2 text-white font-medium rounded-md transition-colors ${isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {isCreating ? 'Termin wird erstellt…' : '📅 Termin erstellen'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-100 font-medium rounded-md hover:bg-gray-200">Abbrechen</button>
            )}
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!appointmentDate || !appointmentTime) {
                alert('Bitte Datum und Uhrzeit auswählen')
                return
              }
              await triggerAppointmentWebhook({
                lead_id: leadId,
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                notes,
              })
              // bewusst kein onSuccess – Webhook ist optional/entkoppelt
            }}
            className="w-full px-4 py-2 text-blue-700 bg-blue-50 font-medium rounded-md hover:bg-blue-100"
          >
            🔗 Workflow starten
          </button>
        </div>
      </form>
    </div>
  )
}


