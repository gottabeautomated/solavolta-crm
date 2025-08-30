import type { Lead } from '../types/leads'
import L from 'leaflet'

export const MAP_CONFIG = {
  center: [47.6965, 13.3457] as [number, number], // Zentrum Österreich
  zoom: 7,
  minZoom: 4,
  maxZoom: 18,
  zoomControl: true,
  scrollWheelZoom: true,
  doubleClickZoom: true,
  dragging: true
}

export const AUSTRIA_CENTER = [47.6965, 13.3457] as [number, number];
export const DEFAULT_LAT = 47.6965
export const DEFAULT_LNG = 13.3457

export const isValidCoordinates = (lat: number | null, lng: number | null) => 
  lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)

export function getLeadsWithCoordinates(leads: Lead[]): Lead[] {
  if (!Array.isArray(leads) || leads.length === 0) return []
  const filtered = leads.filter(lead => isValidCoordinates(lead.lat, lead.lng))
  // harte Obergrenze zur Schonung der UI; feinere Limitierung erfolgt in MapView
  return filtered.length > 20000 ? filtered.slice(0, 20000) : filtered
}

// Einheitliche Farbpalette für Status-Dots
export const STATUS_COLORS: Record<string, string> = {
  'Neu': '#3b82f6',
  'Kontaktiert': '#06b6d4',
  'In Bearbeitung': '#f59e0b',
  'Termin vereinbart': '#0ea5e9',
  'Angebot übermittelt': '#a855f7',
  'In Überlegung': '#10b981',
  'TVP': '#9333ea',
  'Gewonnen': '#16a34a',
  'Verloren': '#ef4444',
  'Nicht erreicht 1x': '#22c55e',
  'Nicht erreicht 2x': '#f59e0b',
  'Nicht erreicht 3x': '#f97316',
  // Archivierte Marker: neutral grau
  'Archiviert': '#9ca3af',
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || '#6b7280'
}

export function getDirectionsUrl(lat: number, lng: number, address?: string): string {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1'
  const destination = address ? `&destination=${encodeURIComponent(address)}` : `&destination=${lat},${lng}`
  return `${baseUrl}&travelmode=driving${destination}`
}

export function calculateBounds(leads: Lead[]): L.LatLngBounds | null {
  const points = leads
    .filter(lead => isValidCoordinates(lead.lat, lead.lng))
    .map(lead => [lead.lat!, lead.lng!] as [number, number]);
  
  if (points.length === 0) return null;
  
  return L.latLngBounds(points);
}

// Existing code...

export function getMarkerIcon(status: string, opts?: { followUp?: boolean; priority?: 'low'|'medium'|'high'|'overdue' }): L.DivIcon {
  const priorityRings: Record<'low'|'medium'|'high'|'overdue', string> = {
    low: '#cbd5e1',
    medium: '#fbbf24',
    high: '#f59e0b',
    overdue: '#ef4444',
  }

  const color = getStatusColor(status)
  const isArchived = status === 'Archiviert'
  const ring = opts?.priority ? priorityRings[opts.priority] : (opts?.followUp ? '#fbbf24' : '#ffffff')

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="position:relative;width:16px;height:16px">
      <div style="position:absolute;inset:-4px;border:2px solid ${isArchived ? '#e5e7eb' : ring};border-radius:50%"></div>
      <div style="position:absolute;inset:0;background-color:${color};width:12px;height:12px;margin:2px;border-radius:50%;border:2px solid white;box-shadow:${isArchived ? 'none' : '0 2px 6px rgba(0,0,0,0.2)'};opacity:${isArchived ? 0.6 : 1}"></div>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export function fixLeafletIcons() {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
  })
}
