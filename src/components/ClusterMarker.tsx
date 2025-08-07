import React, { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Lead } from '../types/leads'
import { getDirectionsUrl } from '../lib/mapUtils'

interface ClusterMarkerProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
  showLabels?: boolean
}

export function ClusterMarker({ leads, onLeadClick, showLabels = false }: ClusterMarkerProps) {
  const map = useMap()

  useEffect(() => {
    const markers = (L as any).markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 15,
      maxClusterRadius: 50
    })

    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return

      let marker: any
      if (showLabels) {
        // Marker mit Name darunter (DivIcon)
        const html = `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div style="width:24px;height:24px;background:#ef4444;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>
            <div style="margin-top:4px;background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:4px;font-size:10px;color:#374151;white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis">${
              (lead.name || 'Unbekannt').slice(0, 18)
            }</div>
          </div>`
        const icon = L.divIcon({ html, className: 'label-marker', iconSize: [24, 24], iconAnchor: [12, 12] })
        marker = L.marker([lead.lat, lead.lng], { icon })
      } else {
        marker = L.marker([lead.lat, lead.lng])
      }

      const name = lead.name || 'Unbekannter Lead'
      const phone = lead.phone ? `📞 ${lead.phone}` : ''
      const email = lead.email ? `✉️ ${lead.email}` : ''
      const address = lead.address ? `📍 ${lead.address}` : ''

      const popupHtml = `
        <div class="p-2 space-y-2" style="min-width:260px;max-width:300px">
          <div style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:4px">
            <div style="font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
          </div>
          ${lead.phone ? `<a href="tel:${lead.phone}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;color:#374151"><span style=\"white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${phone}</span><span style=\"color:#2563eb;font-weight:600\">Anrufen</span></a>` : ''}
          ${lead.email ? `<a href="mailto:${lead.email}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;color:#374151"><span style=\"white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${email}</span><span style=\"color:#2563eb;font-weight:600\">E‑Mail</span></a>` : ''}
          ${address ? `<div style=\"background:#f9fafb;padding:8px 12px;border-radius:6px;color:#6b7280;font-size:12px\">${address}</div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid #e5e7eb;padding-top:8px">
            <button class="open-navigation" style="background:#f3f4f6;color:#374151;padding:8px 12px;border:none;border-radius:6px;font-size:14px;font-weight:600">Navigation</button>
            <button class="open-profile" style="background:#2563eb;color:#fff;padding:8px 12px;border:none;border-radius:6px;font-size:14px;font-weight:600">Profil öffnen</button>
          </div>
        </div>
      `

      marker.bindPopup(popupHtml)
      marker.on('click', () => marker.openPopup())

      marker.on('popupopen', () => {
        const container = (marker as any).getPopup()?.getElement() as HTMLElement | undefined
        if (!container) return
        const profileBtn = container.querySelector('.open-profile') as HTMLButtonElement | null
        if (profileBtn) {
          profileBtn.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation(); onLeadClick?.(lead)
          })
        }
        const navBtn = container.querySelector('.open-navigation') as HTMLButtonElement | null
        if (navBtn) {
          navBtn.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation(); const url = getDirectionsUrl(lead.lat!, lead.lng!, lead.address); window.open(url, '_blank')
          })
        }
      })

      markers.addLayer(marker)
    })

    map.addLayer(markers)

    return () => { map.removeLayer(markers) }
  }, [map, leads, onLeadClick, showLabels])

  return null
}
