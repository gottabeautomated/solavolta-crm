import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { LeadMarker } from './LeadMarker'
import { MapControls } from './MapControls'
import { MAP_CONFIG, getLeadsWithCoordinates, fixLeafletIcons } from '../lib/mapUtils'
import type { Lead, LeadStatus } from '../types/leads'
import 'leaflet/dist/leaflet.css'

// Neue erweiterte Features
import { MapFilterSidebar } from './MapFilterSidebar'
import { MapThemeSwitcher } from './MapThemeSwitcher'
import { LeadHeatmap } from './LeadHeatmap'
import { MAP_THEMES } from '../lib/mapThemes'
import { ClusterMarker } from './ClusterMarker'

interface MapViewProps {
  onLeadClick?: (lead: Lead) => void
}

function AutoFitBounds({ leads, enabled }: { leads: Lead[]; enabled: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!enabled) return
    const pts = leads.filter((l) => l.lat && l.lng)
    if (pts.length === 0) return
    const bounds = L.latLngBounds(pts.map((l) => [l.lat!, l.lng!] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [leads, enabled, map])
  return null
}

export function MapView({ onLeadClick }: MapViewProps) {
  const { leads, loading, error, refetch } = useLeads()
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null)
  const [mapLoading, setMapLoading] = useState(true)

  // Erweiterte Feature-States
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState(MAP_THEMES[0])
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)
  const [showLabels, setShowLabels] = useState(false)
  const [autoFit, setAutoFit] = useState(true)
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])

  useEffect(() => {
    fixLeafletIcons()
    const timer = setTimeout(() => setMapLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setFilteredLeads(getLeadsWithCoordinates(leads))
  }, [leads])

  const filteredByStatus = useMemo(() => {
    let result = filteredLeads
    if (statusFilter) result = result.filter((l) => l.lead_status === statusFilter)
    return result
  }, [filteredLeads, statusFilter])

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
    <div className="relative h-screen flex">
      {/* Linke Sidebar: Filter */}
      <MapFilterSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} leads={leads} onFilteredLeadsChange={setFilteredLeads} />

      {/* Karte */}
      <div className="flex-1 relative">
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
          style={{ height: '100vh', width: '100%' }}
        >
          <TileLayer attribution={currentTheme.attribution} url={currentTheme.url} maxZoom={currentTheme.maxZoom || 19} />

          {clusteringEnabled ? (
            <ClusterMarker leads={filteredByStatus} onLeadClick={onLeadClick} showLabels={showLabels} />
          ) : (
            filteredByStatus.map((lead) => <LeadMarker key={lead.id} lead={lead} onLeadClick={onLeadClick} showLabel={showLabels} />)
          )}

          {/* 1) Filter/Status Controls unten rechts (nur Bounds/Reset anzeigen) */}
          <MapControls
            leads={leads}
            onFilterChange={setStatusFilter}
            currentFilter={statusFilter}
            variant="absolute"
            position="bottom-right"
            offsetClass="bottom-4"
            showStatusFilter={false}
          />

          {/* Heatmap-Layer */}
          <LeadHeatmap leads={filteredByStatus} isVisible={showHeatmap} />

          {/* Auto-Fit Bounds */}
          <AutoFitBounds leads={filteredByStatus} enabled={autoFit} />
        </MapContainer>

        {/* 2) Ansicht-Panel rechts oben: Clustering + Heatmap + Theme */}
        <div className="absolute top-4 right-4 z-[1000] space-y-3">
          <div className="bg-white rounded-lg shadow-lg p-3 space-y-2 max-w-xs">
            <h4 className="text-sm font-semibold text-gray-700">Ansicht</h4>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={clusteringEnabled} onChange={(e) => setClusteringEnabled(e.target.checked)} className="rounded" />
              <span>Clustering</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} className="rounded" />
              <span>Heatmap</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="rounded" />
              <span>Namen anzeigen</span>
            </label>
            <label className="flex items-center space-x-2 text-sm">
              <input type="checkbox" checked={autoFit} onChange={(e) => setAutoFit(e.target.checked)} className="rounded" />
              <span>Auto-Fit</span>
            </label>
          </div>
          <MapThemeSwitcher currentTheme={currentTheme} onThemeChange={setCurrentTheme} />
        </div>

        {/* Filter Toggle Button (Mobile) */}
        <button onClick={() => setSidebarOpen(true)} className="md:hidden absolute top-4 left-4 z-[1000] bg-white text-gray-700 px-3 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors inline-flex items-center text-sm font-medium">
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {filteredLeads.length !== leads.length && <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{filteredLeads.length}</span>}
        </button>

        {/* Stats Panel (Mobile) */}
        <div className="md:hidden absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium">{filteredByStatus.length}</span> von <span className="font-medium">{leads.length}</span> Leads
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setShowHeatmap(!showHeatmap)} className={`text-xs px-2 py-1 rounded transition-colors ${showHeatmap ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{showHeatmap ? '🔥 Heatmap' : 'Heatmap'}</button>
              <button onClick={() => setClusteringEnabled(!clusteringEnabled)} className={`text-xs px-2 py-1 rounded transition-colors ${clusteringEnabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{clusteringEnabled ? '📍 Cluster' : 'Cluster'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
