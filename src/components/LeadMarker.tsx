import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import { getMarkerIcon } from '../lib/mapUtils'
import { LeadStatusBadge } from './ui/Badge'
import type { Lead } from '../types/leads'

interface LeadMarkerProps {
  lead: Lead
  onLeadClick?: (lead: Lead) => void
}

export function LeadMarker({ lead, onLeadClick }: LeadMarkerProps) {
  if (!lead.lat || !lead.lng) return null

  const position: [number, number] = [lead.lat, lead.lng]
  const icon = getMarkerIcon(lead.lead_status)

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) window.open(`tel:${lead.phone}`, '_self')
  }

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) window.open(`mailto:${lead.email}`, '_blank')
  }

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLeadClick?.(lead)
  }

  return (
    <Marker position={position} icon={icon}>
      <Popup closeButton className="lead-popup" maxWidth={300} minWidth={250}>
        <div className="p-2 space-y-3">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{lead.name || 'Unbekannter Lead'}</h3>
            <div className="flex items-center justify-between">
              <LeadStatusBadge status={lead.lead_status} />
              {lead.follow_up && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Follow-up</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {lead.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">📞 {lead.phone}</span>
                <button onClick={handleCallClick} className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Anrufen
                </button>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">✉️ {lead.email}</span>
                <button onClick={handleEmailClick} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  E-Mail
                </button>
              </div>
            )}
            {lead.address && <div className="text-sm text-gray-600">📍 {lead.address}</div>}
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            {lead.contact_type && <div>Kontakttyp: {lead.contact_type}</div>}
            {lead.appointment_date && (
              <div>
                Termin: {new Date(lead.appointment_date).toLocaleDateString('de-DE')}
                {lead.appointment_time && ` um ${lead.appointment_time}`}
              </div>
            )}
            <div>Erstellt: {new Date(lead.created_at).toLocaleDateString('de-DE')}</div>
          </div>

          <div className="border-t border-gray-200 pt-2">
            <button onClick={handleDetailsClick} className="w-full text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded">
              Details anzeigen
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
