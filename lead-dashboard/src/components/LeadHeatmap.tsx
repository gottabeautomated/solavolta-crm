import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'
import type { Lead } from '../types/leads'

interface LeadHeatmapProps {
  leads: Lead[]
  isVisible: boolean
  intensity?: number
}

export function LeadHeatmap({ leads, isVisible, intensity = 0.5 }: LeadHeatmapProps) {
  const map = useMap()

  useEffect(() => {
    if (!isVisible) return

    const heatmapData = leads
      .filter((lead) => lead.lat && lead.lng)
      .map((lead) => [lead.lat!, lead.lng!, intensity] as [number, number, number])

    if (heatmapData.length === 0) return

    const heatLayer = (L as any).heatLayer(heatmapData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, leads, isVisible, intensity])

  return null
}
