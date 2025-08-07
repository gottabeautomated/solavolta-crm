# Step 5.1: Kartenansicht mit Leaflet (Basis-Karte)

## 🎯 Ziel
Eine interaktive Kartenansicht mit Leaflet.js implementieren, die alle Leads mit Koordinaten als Marker anzeigt und mobile-optimiert ist.

## 📋 Checkliste

### Leaflet Integration
- [x] `react-leaflet` und `leaflet` konfigurieren
- [x] CSS imports und Icon-Setup
- [x] Basis-Karte mit OpenStreetMap
- [x] Österreich als Standard-Ansicht

### Lead-Marker
- [x] Marker für jeden Lead mit Koordinaten
- [x] Custom Marker-Icons nach Status
- [x] Popups mit Lead-Informationen
- [x] Direktwahl-Links in Popups

### Map-Komponenten
- [x] `MapView.tsx` Hauptkomponente
- [x] `LeadMarker.tsx` für einzelne Marker
- [x] `MapControls.tsx` für Zoom/Filter
- [x] Mobile-responsive Container

### Navigation Integration
- [x] Map-View in App-Navigation einbinden
- [x] Toggle zwischen Liste und Karte
- [x] Loading States für Karte
- [x] Error Handling bei fehlenden Koordinaten

## 🔧 Cursor Commands

### Dependencies installieren
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### Dateien erstellen
```bash
touch src/components/MapView.tsx
touch src/components/LeadMarker.tsx
touch src/components/MapControls.tsx
touch src/lib/mapUtils.ts
```

## 📁 Zu erstellende Dateien

### `src/lib/mapUtils.ts`
```typescript
import L from 'leaflet'
import type { Lead, LeadStatus } from '../types/leads'

// Marker-Icons für verschiedene Status
export const getMarkerIcon = (status: LeadStatus | null): L.DivIcon => {
  const getStatusConfig = (status: LeadStatus | null) => {
    switch (status) {
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

// Österreich Bounds für initiale Kartenansicht
export const AUSTRIA_BOUNDS: [[number, number], [number, number]] = [
  [46.3722, 9.5307], // Südwest
  [49.0205, 17.1608] // Nordost
]

// Österreich Center
export const AUSTRIA_CENTER: [number, number] = [47.6965, 13.3457]

// Map-Konfiguration
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

// Utility: Leads mit Koordinaten filtern
export const getLeadsWithCoordinates = (leads: Lead[]): Lead[] => {
  return leads.filter(lead => 
    lead.lat !== null && 
    lead.lng !== null && 
    !isNaN(lead.lat) && 
    !isNaN(lead.lng)
  )
}

// Utility: Bounds für alle Leads berechnen
export const calculateBounds = (leads: Lead[]): [[number, number], [number, number]] | null => {
  const validLeads = getLeadsWithCoordinates(leads)
  
  if (validLeads.length === 0) {
    return null
  }

  const lats = validLeads.map(lead => lead.lat!)
  const lngs = validLeads.map(lead => lead.lng!)

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)]
  ]
}

// Utility: Distanz zwischen zwei Punkten berechnen (Haversine)
export const calculateDistance = (
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number => {
  const R = 6371 // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Leaflet CSS fix für Webpack
export const fixLeafletIcons = () => {
  // Leaflet Marker Icons Fix für Webpack
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })
}
```

### `src/components/LeadMarker.tsx`
```typescript
import React from 'react'
import { Marker, Popup } from 'react-leaflet'
import { getMarkerIcon } from '../lib/mapUtils'
import { LeadStatusBadge } from './ui/Badge'
import type { Lead } from '../types/leads'

interface LeadMarkerProps {
  lead: Lead
  onLeadClick?: (lead: Lead) => void
}

export function LeadMarker({ lead, onLeadClick }: LeadMarkerProps) {
  // Koordinaten prüfen
  if (!lead.lat || !lead.lng) {
    return null
  }

  const position: [number, number] = [lead.lat, lead.lng]
  const icon = getMarkerIcon(lead.lead_status)

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_self')
    }
  }

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_blank')
    }
  }

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLeadClick?.(lead)
  }

  return (
    <Marker position={position} icon={icon}>
      <Popup 
        closeButton={true}
        className="lead-popup"
        maxWidth={300}
        minWidth={250}
      >
        <div className="p-2 space-y-3">
          {/* Header */}
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {lead.name || 'Unbekannter Lead'}
            </h3>
            <div className="flex items-center justify-between">
              <LeadStatusBadge status={lead.lead_status} />
              {lead.follow_up && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  Follow-up
                </span>
              )}
            </div>
          </div>

          {/* Kontaktdaten */}
          <div className="space-y-2">
            {lead.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">📞 {lead.phone}</span>
                <button
                  onClick={handleCallClick}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                >
                  Anrufen
                </button>
              </div>
            )}

            {lead.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate">✉️ {lead.email}</span>
                <button
                  onClick={handleEmailClick}
                  className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                >
                  E-Mail
                </button>
              </div>
            )}

            {lead.address && (
              <div className="text-sm text-gray-600">
                📍 {lead.address}
              </div>
            )}
          </div>

          {/* Zusätzliche Info */}
          <div className="text-xs text-gray-500 space-y-1">
            {lead.contact_type && (
              <div>Kontakttyp: {lead.contact_type}</div>
            )}
            
            {lead.appointment_date && (
              <div>
                Termin: {new Date(lead.appointment_date).toLocaleDateString('de-DE')}
                {lead.appointment_time && ` um ${lead.appointment_time}`}
              </div>
            )}

            <div>
              Erstellt: {new Date(lead.created_at).toLocaleDateString('de-DE')}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 pt-2">
            <button
              onClick={handleDetailsClick}
              className="w-full text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition-colors"
            >
              Details anzeigen
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}
```

### `src/components/MapControls.tsx`
```typescript
import React from 'react'
import { useMap } from 'react-leaflet'
import type { Lead, LeadStatus } from '../types/leads'
import { LEAD_STATUS_OPTIONS } from '../types/leads'
import { calculateBounds, AUSTRIA_CENTER } from '../lib/mapUtils'

interface MapControlsProps {
  leads: Lead[]
  onFilterChange?: (status: LeadStatus | null) => void
  currentFilter?: LeadStatus | null
}

export function MapControls({ leads, onFilterChange, currentFilter }: MapControlsProps) {
  const map = useMap()

  // Zu allen Leads zoomen
  const handleFitBounds = () => {
    const bounds = calculateBounds(leads)
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    } else {
      map.setView(AUSTRIA_CENTER, 7)
    }
  }

  // Zu Österreich-Ansicht zurückkehren
  const handleResetView = () => {
    map.setView(AUSTRIA_CENTER, 7)
  }

  // Status-Filter ändern
  const handleStatusFilter = (status: LeadStatus | null) => {
    onFilterChange?.(status)
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 space-y-3 max-w-xs">
      {/* Zoom Controls */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Ansicht</h4>
        <div className="flex space-x-2">
          <button
            onClick={handleFitBounds}
            className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
          >
            Alle Leads
          </button>
          <button
            onClick={handleResetView}
            className="flex-1 text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
          >
            Österreich
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Filter</h4>
        <div className="space-y-1">
          <button
            onClick={() => handleStatusFilter(null)}
            className={`w-full text-xs px-2 py-1 rounded text-left transition-colors ${
              currentFilter === null 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle Status ({leads.length})
          </button>
          
          {LEAD_STATUS_OPTIONS.map(status => {
            const count = leads.filter(lead => lead.lead_status === status).length
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`w-full text-xs px-2 py-1 rounded text-left transition-colors ${
                  currentFilter === status 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Lead Count */}
      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        {leads.filter(lead => lead.lat && lead.lng).length} von {leads.length} Leads auf Karte
      </div>
    </div>
  )
}
```

### `src/components/MapView.tsx`
```typescript
import React, { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { LeadMarker } from './LeadMarker'
import { MapControls } from './MapControls'
import { MAP_CONFIG, getLeadsWithCoordinates, fixLeafletIcons } from '../lib/mapUtils'
import type { Lead, LeadStatus } from '../types/leads'

// Leaflet CSS Import
import 'leaflet/dist/leaflet.css'

interface MapViewProps {
  onLeadClick?: (lead: Lead) => void
}

export function MapView({ onLeadClick }: MapViewProps) {
  const { leads, loading, error, refetch } = useLeads()
  const [statusFilter, setStatusFilter] = useState<LeadStatus | null>(null)
  const [mapLoading, setMapLoading] = useState(true)

  // Leaflet Icons Fix
  useEffect(() => {
    fixLeafletIcons()
    
    // Map Loading Timer
    const timer = setTimeout(() => {
      setMapLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Gefilterte Leads mit Koordinaten
  const filteredLeads = useMemo(() => {
    let result = getLeadsWithCoordinates(leads)
    
    if (statusFilter) {
      result = result.filter(lead => lead.lead_status === statusFilter)
    }
    
    return result
  }, [leads, statusFilter])

  // Loading State
  if (loading || mapLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {loading ? 'Lade Leads...' : 'Initialisiere Karte...'}
          </p>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <ErrorMessage 
          title="Fehler beim Laden der Karte"
          message={error}
          onRetry={refetch}
        />
      </div>
    )
  }

  // No Coordinates State
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
          <p className="text-gray-600 mb-4">
            Fügen Sie Adressen zu Ihren Leads hinzu, damit sie auf der Karte angezeigt werden können.
          </p>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Leads neu laden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-screen">
      {/* Map Container */}
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
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Lead Markers */}
        {filteredLeads.map((lead) => (
          <LeadMarker
            key={lead.id}
            lead={lead}
            onLeadClick={onLeadClick}
          />
        ))}

        {/* Map Controls */}
        <MapControls
          leads={leads}
          onFilterChange={setStatusFilter}
          currentFilter={statusFilter}
        />
      </MapContainer>

      {/* Mobile Info Panel */}
      <div className="md:hidden absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium">{filteredLeads.length}</span> Leads
            {statusFilter && (
              <span className="text-gray-500"> • {statusFilter}</span>
            )}
          </div>
          <button
            onClick={() => setStatusFilter(null)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              statusFilter 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {statusFilter ? 'Filter entfernen' : 'Alle'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### CSS für Custom Leaflet Styles (zu `src/index.css` hinzufügen)
```css
/* Leaflet Custom Styles */
.custom-div-icon {
  background: transparent !important;
  border: none !important;
}

.leaflet-popup-content-wrapper {
  border-radius: 8px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
}

.leaflet-popup-content {
  margin: 0 !important;
  width: auto !important;
}

.leaflet-popup-tip {
  background: white !important;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1) !important;
}

.lead-popup .leaflet-popup-close-button {
  color: #6b7280 !important;
  font-size: 18px !important;
  padding: 4px !important;
}

.lead-popup .leaflet-popup-close-button:hover {
  color: #374151 !important;
  background: #f3f4f6 !important;
  border-radius: 4px !important;
}

/* Mobile Responsive Map */
@media (max-width: 768px) {
  .leaflet-control-container {
    display: none;
  }
  
  .leaflet-popup-content-wrapper {
    max-width: 280px !important;
  }
}
```

### `src/App.tsx` (erweitern für Map-Navigation)
```typescript
import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import { LeadDetail } from './components/LeadDetail'
import { MapView } from './components/MapView'
import type { Lead } from './types/leads'

type View = 'list' | 'detail' | 'map'

function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedLeadId(null)
  }

  const handleShowMap = () => {
    setCurrentView('map')
    setSelectedLeadId(null)
  }

  return (
    <>
      {currentView === 'list' && (
        <Layout>
          <div className="space-y-6">
            {/* Header mit Map-Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
                <p className="text-gray-600">
                  Verwalten Sie Ihre Vertriebskontakte
                </p>
              </div>
              <button
                onClick={handleShowMap}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Kartenansicht
              </button>
            </div>

            {/* Lead Liste */}
            <LeadList onLeadClick={handleLeadClick} />
          </div>
        </Layout>
      )}

      {currentView === 'detail' && selectedLeadId && (
        <Layout>
          <LeadDetail 
            leadId={selectedLeadId}
            onBack={handleBackToList}
          />
        </Layout>
      )}

      {currentView === 'map' && (
        <div className="relative">
          {/* Map Back Button */}
          <button
            onClick={handleBackToList}
            className="absolute top-4 left-4 z-[1001] bg-white text-gray-700 px-3 py-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors inline-flex items-center text-sm font-medium"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Liste
          </button>
          
          <MapView onLeadClick={handleLeadClick} />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
```

## 🧪 Tests

### 1. Dependencies installieren
```bash
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### 2. Entwicklungsserver starten
```bash
npm run dev
```

### 3. Kartenansicht testen
- [x] **Navigation**: "Kartenansicht" Button in Lead-Liste funktioniert
- [x] **Karte lädt**: OpenStreetMap wird angezeigt
- [x] **Marker anzeigen**: Leads mit Koordinaten werden als Marker angezeigt
- [x] **Marker-Icons**: Verschiedene Icons je nach Lead-Status
- [x] **Popups**: Klick auf Marker öffnet Info-Popup

### 4. Popup-Funktionen testen
- [x] **Anrufen-Button**: `tel:`-Link funktioniert auf Mobile
- [x] **E-Mail-Button**: E-Mail-Client öffnet sich
- [x] **Details-Button**: Navigation zur Lead-Detailansicht
- [x] **Popup-Inhalt**: Alle Lead-Informationen werden angezeigt

### 5. Map-Controls testen
- [x] **"Alle Leads" Button**: Zoomt zu allen Markern
- [x] **"Österreich" Button**: Kehrt zur Standard-Ansicht zurück
- [x] **Status-Filter**: Filtert Marker nach Lead-Status
- [x] **Lead-Counter**: Zeigt korrekte Anzahl der Marker

### 6. Mobile Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# Mobile Controls sollten funktionieren
```

### 7. Performance testen
- [x] **Viele Marker**: Mit vielen Test-Leads testen
- [x] **Zoom-Performance**: Rein/Raus-Zoomen funktioniert flüssig
- [x] **Filter-Performance**: Status-Filter reagiert schnell

## ✅ Definition of Done
- [x] Karte wird mit Österreich-Zentrum geladen
- [x] Alle Leads mit Koordinaten werden als Marker angezeigt
- [x] Marker haben status-abhängige Icons
- [x] Popups zeigen alle relevanten Lead-Informationen
- [x] Direktwahl-Links funktionieren
- [x] Navigation zwischen Liste und Karte funktioniert
- [x] Map-Controls für Zoom und Filter funktionieren
- [x] Mobile-responsive Design
- [x] Loading/Error States werden behandelt

## 🔗 Nächster Step
**Step 5.2:** Lead-Marker erweitern (Clustering, Custom Icons)

---

## 📝 Notes & Troubleshooting

**Problem:** Karte wird nicht angezeigt
**Lösung:** Leaflet CSS Import prüfen, Browser Console auf Fehler checken

**Problem:** Marker werden nicht angezeigt
**Lösung:** Koordinaten in Test-Daten prüfen, `getLeadsWithCoordinates` Funktion testen

**Problem:** Icons werden nicht richtig angezeigt
**Lösung:** `fixLeafletIcons()` wird aufgerufen, Custom CSS für `custom-div-icon` prüfen

**Problem:** Popups funktionieren nicht
**Lösung:** Event-Handler in LeadMarker prüfen, `stopPropagation()` verwenden

**Problem:** Mobile Performance schlecht
**Lösung:** Marker-Clustering implementieren (Step 5.2), Zoom-Level anpassen
