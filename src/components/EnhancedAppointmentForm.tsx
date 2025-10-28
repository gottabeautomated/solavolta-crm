import React, { useState } from 'react'
import { useAppointments } from '../hooks/useAppointments'
import { calendarService } from '../lib/calendarService'
import type { Lead } from '../types/leads'

interface EnhancedAppointmentFormProps {
  lead: Lead
  tenantId: string
  onSuccess?: (result: any) => void
  onCancel?: () => void
}

export function EnhancedAppointmentForm({ lead, tenantId, onSuccess, onCancel }: EnhancedAppointmentFormProps) {
  const { isCreating, createLocalAppointment } = useAppointments()

  // Form State
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [meetingType, setMeetingType] = useState<'vor_ort' | 'online' | 'telefon'>('vor_ort')
  const [location, setLocation] = useState(lead.address || '')
  const [notes, setNotes] = useState('')
  
  // Einladungs-Optionen
  const [sendInvite, setSendInvite] = useState(true)
  const [customerEmail, setCustomerEmail] = useState(lead.email || '')
  const [customerPhone, setCustomerPhone] = useState(lead.phone || '')
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const timeSlots = calendarService.generateTimeSlots()
  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validierung
    if (!appointmentDate || !appointmentTime) {
      setError('Bitte Datum und Uhrzeit auswählen')
      return
    }

    if (sendInvite && !customerEmail) {
      setError('Für Kalendereinladungen wird eine E-Mail-Adresse benötigt')
      return
    }

    setLoading(true)

    try {
      if (sendInvite && customerEmail) {
        // Kalender-Automation via n8n Webhook
        const result = await calendarService.createAppointmentWithInvite({
          leadId: lead.id,
          tenantId,
          customerName: lead.name || 'Kunde',
          customerEmail,
          customerPhone,
          appointmentDate,
          appointmentTime,
          durationMinutes,
          meetingType,
          location: meetingType === 'vor_ort' ? location : undefined,
          notes,
          sendInvite: true,
        })

        console.log('📅 Webhook result:', result)
        
        if (result.success) {
          setSuccess(true)
          setTimeout(() => onSuccess?.(result), 1500)
        } else {
          console.error('❌ Webhook failed:', result)
          throw new Error(result.error || 'Fehler beim Erstellen des Termins')
        }
      } else {
        // Einfacher Termin ohne Einladung
        const result = await createLocalAppointment(lead.id, appointmentDate, appointmentTime, notes)
        if (result.success) {
          setSuccess(true)
          setTimeout(() => onSuccess?.(result), 1500)
        } else {
          throw new Error(result.error || 'Fehler beim Erstellen des Termins')
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      console.error('❌ Appointment creation error:', err)
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Termin vereinbaren</h3>
          <p className="text-sm text-gray-600 mt-1">mit {lead.name}</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Termin-Details */}
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium text-gray-900">📅 Termin-Details</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uhrzeit <span className="text-red-500">*</span>
              </label>
              <select
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Uhrzeit wählen</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot} Uhr
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dauer (Minuten)
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>30 Minuten</option>
              <option value={45}>45 Minuten</option>
              <option value={60}>60 Minuten</option>
              <option value={90}>90 Minuten</option>
              <option value={120}>120 Minuten</option>
            </select>
          </div>
        </div>

        {/* Meeting-Art */}
        <div className="space-y-4 border-b pb-6">
          <h4 className="font-medium text-gray-900">🎯 Art des Termins</h4>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'vor_ort', label: 'Vor Ort', icon: '🏠' },
              { value: 'online', label: 'Online', icon: '💻' },
              { value: 'telefon', label: 'Telefon', icon: '📞' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMeetingType(option.value as any)}
                className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                  meetingType === option.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                {option.label}
              </button>
            ))}
          </div>

          {meetingType === 'vor_ort' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Straße, PLZ Ort"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {meetingType === 'online' && (
            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
              💡 Ein Google Meet Link wird automatisch erstellt
            </div>
          )}
        </div>

        {/* Kalender-Einladung */}
        <div className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">📧 Kalendereinladung</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Einladung versenden
              </span>
            </label>
          </div>

          {sendInvite && (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kunden-E-Mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="kunde@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={sendInvite}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kunden-Telefon (optional)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+49 123 456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-white p-3 rounded border border-blue-200">
                <p className="text-sm text-gray-600">
                  ✅ Der Kunde erhält automatisch:
                </p>
                <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                  <li>• E-Mail mit Terminbestätigung</li>
                  <li>• ICS-Datei zum Kalender hinzufügen</li>
                  {meetingType === 'online' && <li>• Google Meet Link</li>}
                  <li>• Erinnerung 24h vorher</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Notizen */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notizen (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Zusätzliche Informationen, Gesprächsthemen..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Feedback */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 flex items-start gap-2">
              <span className="text-lg">❌</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span>
                Termin erfolgreich erstellt!
                {sendInvite && ' Einladung wurde versendet.'}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || success}
            className={`flex-1 px-6 py-3 text-white font-medium rounded-lg transition-all ${
              loading || success
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Termin wird erstellt...
              </span>
            ) : success ? (
              '✅ Erfolgreich erstellt'
            ) : (
              `📅 Termin ${sendInvite ? 'erstellen & Einladung senden' : 'erstellen'}`
            )}
          </button>

          {onCancel && !success && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

