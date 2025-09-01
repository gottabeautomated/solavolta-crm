import { useEffect } from 'react'
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
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      chunkDelay: 40,
      chunkInterval: 120,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 15,
      // Dynamischer Radius: kleinere Cluster bei höherem Zoom
      maxClusterRadius: (zoom: number) => (zoom < 8 ? 80 : zoom < 12 ? 60 : 40),
      iconCreateFunction: (cluster: L.MarkerCluster) => {
        const count = cluster.getChildCount()
        const sizeClass = count >= 100 ? 'large' : count >= 10 ? 'medium' : 'small'

        return L.divIcon({
          html: `<div class="cluster-badge ${sizeClass}"><span class="cluster-count">${count}</span></div>`,
          className: 'cluster-icon',
        })
      },
    }) as L.MarkerClusterGroup

    // dynamisch Marker-Anzahl abhängig von Zoom begrenzen
    const zoom = map.getZoom()
    const limit = zoom >= 13 ? 5000 : zoom >= 11 ? 3000 : 1500
    let added = 0

    const toAdd: L.Marker[] = []
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i]
      if (lead.lat == null || lead.lng == null) continue
      if (added >= limit) break

      let marker: L.Marker
      // Immer Marker mit permanentem Label (Name) rendern
      const baseColor = (lead as any).archived ? '#9ca3af' : '#ef4444'
      const ring = lead.follow_up ? '#fbbf24' : '#ffffff'
      const html = `
        <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="position:relative;width:20px;height:20px">
            <div style="position:absolute;inset:-4px;border:2px solid ${ring};border-radius:50%"></div>
            <div style="position:absolute;inset:0;background:${baseColor};border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2)"></div>
          </div>
          <div class="sv-label-click" style="margin-top:4px;background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:4px;font-size:10px;color:#374151;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;cursor:pointer">${
            (lead.name || 'Unbekannt').slice(0, 22)
          }</div>
        </div>`
      const icon = L.divIcon({ html, className: 'label-marker', iconSize: [24, 24], iconAnchor: [12, 12] })
      marker = L.marker([lead.lat, lead.lng], { icon })

      const name = lead.name || 'Unbekannter Lead'
      const phone = lead.phone ? `📞 ${lead.phone}` : ''
      const email = lead.email ? `✉️ ${lead.email}` : ''
      const address = lead.address ? `📍 ${lead.address}` : ''

      // Erzeuge DOM-Element für Popup, damit Event-Listener zuverlässig greifen
      const popupEl = document.createElement('div')
      popupEl.className = 'p-2 space-y-2'
      popupEl.style.minWidth = '260px'
      popupEl.style.maxWidth = '300px'
      popupEl.innerHTML = `
        <div style="border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:4px">
          <div style="font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
        </div>
        ${lead.phone ? `<a href="tel:${lead.phone}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;color:#374151"><span style=\"white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${phone}</span><span style=\"color:#2563eb;font-weight:600\">Anrufen</span></a>` : ''}
        ${lead.email ? `<a href="mailto:${lead.email}" target="_blank" rel="noopener" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;text-decoration:none;color:#374151"><span style=\"white-space:nowrap;overflow:hidden;text-overflow:ellipsis\">${email}</span><span style=\"color:#2563eb;font-weight:600\">E‑Mail</span></a>` : ''}
        ${address ? `<div style=\"background:#f9fafb;padding:8px 12px;border-radius:6px;color:#6b7280;font-size:12px\">${address}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;border-top:1px solid #e5e7eb;padding-top:8px">
          <button class="open-navigation" type="button" style="background:#f3f4f6;color:#374151;padding:8px 12px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">Navigation</button>
          <button class="open-profile" type="button" style="background:#2563eb;color:#fff;padding:8px 12px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer">Profil öffnen</button>
        </div>
      `

      marker.bindPopup(popupEl, { closeButton: true, autoPan: true })
      marker.on('click', () => marker.openPopup())

      // Listener vorab an DOM hängen (funktioniert stabiler als nachträglich suchen)
      const profileBtn = popupEl.querySelector('.open-profile') as HTMLButtonElement | null
      if (profileBtn) {
        L.DomEvent.on(profileBtn, 'click', (ev: any) => {
          L.DomEvent.preventDefault(ev)
          L.DomEvent.stop(ev)
          onLeadClick?.(lead)
        })
      }
      const navBtn = popupEl.querySelector('.open-navigation') as HTMLButtonElement | null
      if (navBtn) {
        L.DomEvent.on(navBtn, 'click', (ev: any) => {
          L.DomEvent.preventDefault(ev)
          L.DomEvent.stop(ev)
          const url = getDirectionsUrl(lead.lat, lead.lng, lead.address)
          window.open(url, '_blank')
        })
      }

      // Name-Label klickbar: öffnet Popup (Details)
      const labelEl = (marker.getElement()?.querySelector('.sv-label-click') as HTMLElement) || null
      if (labelEl) {
        L.DomEvent.on(labelEl, 'click', (ev: any) => {
          L.DomEvent.preventDefault(ev)
          L.DomEvent.stop(ev)
          marker.openPopup()
        })
      }

      toAdd.push(marker)
      added++
    }

    if (toAdd.length > 0) {
      markers.addLayers(toAdd)
    }
    map.addLayer(markers)

    return () => {
      map.removeLayer(markers)
    }
  }, [map, leads, onLeadClick, showLabels])

  return null
}
