import type { Lead } from '../types/leads'
import L from 'leaflet'

export const MAP_CONFIG = {
  center: [47.6965, 13.3457] as [number, number], // Zentrum Österreich
  zoom: 7,
  minZoom: 3,
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
  return leads.filter(lead => isValidCoordinates(lead.lat, lead.lng))
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

export function getMarkerIcon(status: string): L.DivIcon {
  const colors: Record<string, string> = {
    'Neu': '#3b82f6',
    'Offen': '#10b981',
    'Gewonnen': '#8b5cf6',
    'Verloren': '#ef4444',
    'In Bearbeitung': '#f59e0b'
  };
  const color = colors[status] || '#6b7280';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>`,
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
