import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { LeadMarker } from './LeadMarker'
import { MapControls } from './MapControls'
import { MAP_CONFIG, getLeadsWithCoordinates, fixLeafletIcons } from '../lib/mapUtils'
import type { Lead, LeadStatus } from '../types/leads'
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  onLeadClick?: (lead: Lead) => void
}

export function MapView({ onLeadClick }: MapViewProps) {
  const { leads, loading, error, refetch } = useLeads()
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    fixLeafletIcons()
    const timer = setTimeout(() => setMapLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const filteredLeads = useMemo(() => {
    let result = getLeadsWithCoordinates(leads)
    if (statusFilter) result = result.filter((l) => l.lead_status === statusFilter)
    return result
  }, [leads, statusFilter])

  if (loading || mapLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">{loading ? 'Lade Leads...' : 'Initialisiere Karte...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage title="Fehler beim Laden der Karte" message={error} onRetry={refetch} />
      </div>
    )
  }

  if (getLeadsWithCoordinates(leads).length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Leads mit Koordinaten</h3>
          <p className="text-gray-600 mb-4">Fügen Sie Adressen zu Ihren Leads hinzu, damit sie auf der Karte angezeigt werden können.</p>
          <button onClick={refetch} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            Leads neu laden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen">
      <MapContainer
        center={MAP_CONFIG.center}
        zoom={MAP_CONFIG.zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        zoomControl={MAP_CONFIG.zoomControl}
        scrollWheelZoom={MAP_CONFIG.scrollWheelZoom}
        doubleClickZoom={MAP_CONFIG.doubleClickZoom}
        dragging={MAP_CONFIG.dragging}
        className="h-full w-full"
        style={{ height: '100vh', width: '100vw' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {filteredLeads.map((lead) => (
          <LeadMarker key={lead.id} lead={lead} onLeadClick={onLeadClick} />
        ))}

        <MapControls leads={leads} onFilterChange={setStatusFilter} currentFilter={statusFilter} />
      </MapContainer>

      <div className="md:hidden absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{filteredLeads.length}</span> Leads
            {statusFilter && <span className="text-gray-500"> • {statusFilter}</span>}
          </div>
          <button
            onClick={() => setStatusFilter(null)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              statusFilter ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {statusFilter ? 'Filter entfernen' : 'Alle'}
          </button>
        </div>
      </div>
    </div>
  )
}
