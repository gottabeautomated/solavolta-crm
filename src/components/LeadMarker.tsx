import React, { useRef } from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { getMarkerIcon, getDirectionsUrl, isValidCoordinates, DEFAULT_LAT, DEFAULT_LNG } from '../lib/mapUtils'
import { LeadStatusBadge } from './ui/Badge'
import type { Lead } from '../types/leads'

interface LeadMarkerProps {
  lead: Lead
  onLeadClick?: (lead: Lead) => void
  showLabel?: boolean
}

export function LeadMarker({ lead, onLeadClick, showLabel = false }: LeadMarkerProps) {
  if (!lead.lat || !lead.lng) return null

  const position: [number, number] = [lead.lat, lead.lng]
  const priority = (lead as any).top_priority as any
  const statusForIcon = (lead as any).archived ? 'Archiviert' : (lead.lead_status || 'Neu')
  const icon = getMarkerIcon(statusForIcon, { followUp: !!lead.follow_up, priority: priority as any })
  const markerRef = useRef<L.Marker | null>(null)

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

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const lat = isValidCoordinates(lead.lat, lead.lng) ? lead.lat : DEFAULT_LAT;
    const lng = isValidCoordinates(lead.lat, lead.lng) ? lead.lng : DEFAULT_LNG;
    const url = getDirectionsUrl(lat, lng, lead.address);
    window.open(url, '_blank')
  }

  return (
    <Marker position={position} icon={icon} ref={markerRef}>
      <Tooltip
        direction="top"
        offset={[0, -12]}
        opacity={0.95}
        permanent
        eventHandlers={{
          click: () => {
            try { markerRef.current?.openPopup() } catch {}
          }
        }}
      >
        <span style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>{(lead.name || 'Unbekannt').slice(0, 30)}</span>
      </Tooltip>
      <Popup closeButton className="lead-popup" maxWidth={320} minWidth={260}>
        <div className="p-2 space-y-3">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1 truncate">
              {lead.name || 'Unbekannter Lead'}
            </h3>
            <div className="flex items-center justify-between">
              <LeadStatusBadge status={lead.lead_status} />
              {lead.follow_up && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Follow-up</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {lead.phone && (
              <button onClick={handleCallClick} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-sm" title="Anrufen">
                <span className="text-gray-700 truncate">📞 {lead.phone}</span>
                <span className="text-blue-600 font-medium">Anrufen</span>
              </button>
            )}
            {lead.email && (
              <button onClick={handleEmailClick} className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-sm" title="E‑Mail senden">
                <span className="text-gray-700 truncate">✉️ {lead.email}</span>
                <span className="text-blue-600 font-medium">E‑Mail</span>
              </button>
            )}
            {lead.address && (
              <div className="px-3 py-2 rounded-md bg-gray-50 text-xs text-gray-600">📍 {lead.address}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleNavigate} className="w-full text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors">
              Navigation
            </button>
            <button onClick={handleDetailsClick} className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors">
              Profil öffnen
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
