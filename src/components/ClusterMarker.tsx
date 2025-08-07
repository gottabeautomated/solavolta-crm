import React, { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { Lead } from '../types/leads'
import { LeadMarker } from './LeadMarker'

interface ClusterMarkerProps {
  leads: Lead[]
  onLeadClick?: (lead: Lead) => void
}

// Hinweis: Für react-leaflet v5 gibt es kein offizielles Cluster-Addon,
// daher nutzen wir leaflet.markercluster direkt und fügen Marker manuell hinzu.
export function ClusterMarker({ leads, onLeadClick }: ClusterMarkerProps) {
  const map = useMap()

  useEffect(() => {
    // Gruppe erstellen
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

    // Marker hinzufügen
    leads.forEach((lead) => {
      if (!lead.lat || !lead.lng) return
      const m = L.marker([lead.lat, lead.lng]) as any
      // kleine Popup-Info
      const name = lead.name || 'Unbekannter Lead'
      m.bindPopup(`<div><strong>${name}</strong><br/>${lead.address || ''}</div>`)
      m.on('click', () => onLeadClick?.(lead))
      markers.addLayer(m)
    })

    map.addLayer(markers)

    return () => {
      map.removeLayer(markers)
    }
  }, [map, leads, onLeadClick])

  return null
}
