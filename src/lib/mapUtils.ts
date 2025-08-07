import L from 'leaflet'
import type { Lead, LeadStatus } from '../types/leads'

export const getMarkerIcon = (status: LeadStatus | null): L.DivIcon => {
  const getStatusConfig = (s: LeadStatus | null) => {
    switch (s) {
      case 'Neu':
        return { color: 'bg-blue-500', emoji: '🆕', ring: 'ring-blue-200' }
      case 'Offen':
        return { color: 'bg-yellow-500', emoji: '📞', ring: 'ring-yellow-200' }
      case 'Gewonnen':
        return { color: 'bg-green-500', emoji: '✅', ring: 'ring-green-200' }
      case 'Verloren':
        return { color: 'bg-red-500', emoji: '❌', ring: 'ring-red-200' }
      default:
        return { color: 'bg-gray-500', emoji: '❓', ring: 'ring-gray-200' }
    }
  }

  const config = getStatusConfig(status)

  return L.divIcon({
    html: `
      <div class="relative">
        <div class="${config.color} ${config.ring} ring-4 w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg">
          <span class="text-lg">${config.emoji}</span>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50]
  })
}

export const AUSTRIA_BOUNDS: [[number, number], [number, number]] = [
  [46.3722, 9.5307],
  [49.0205, 17.1608]
]

export const AUSTRIA_CENTER: [number, number] = [47.6965, 13.3457]

export const MAP_CONFIG = {
  center: AUSTRIA_CENTER,
  zoom: 7,
  minZoom: 6,
  maxZoom: 18,
  zoomControl: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  dragging: true
}

export const getLeadsWithCoordinates = (leads: Lead[]): Lead[] => {
  return (leads || []).filter(
    (lead) => lead.lat !== null && lead.lng !== null && !isNaN(Number(lead.lat)) && !isNaN(Number(lead.lng))
  )
}

export const calculateBounds = (leads: Lead[]): [[number, number], [number, number]] | null => {
  const validLeads = getLeadsWithCoordinates(leads)
  if (validLeads.length === 0) return null
  const lats = validLeads.map((l) => l.lat!)
  const lngs = validLeads.map((l) => l.lng!)
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ]
}

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}
