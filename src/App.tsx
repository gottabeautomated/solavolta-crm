import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import { LeadDetail } from './components/LeadDetail'
import { StatusOverview } from './components/status/StatusOverview'
import { GeocodingDebugPanel } from './components/GeocodingDebugPanel'
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

  const handleShowLeads = () => {
    setCurrentView('list')
    setSelectedLeadId(null)
  }

  return (
    <>
      {currentView === 'list' && (
        <Layout onShowLeads={handleShowLeads} onShowMap={handleShowMap}>
          <div className="space-y-6">
            {/* Header mit Map-Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
                <p className="text-gray-600">Verwalten Sie Ihre Vertriebskontakte</p>
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

            {/* Status Overview */}
            <StatusOverview />

            {/* Lead Liste */}
            {import.meta.env.DEV && <GeocodingDebugPanel />}
            <LeadList onLeadClick={handleLeadClick} />
          </div>
        </Layout>
      )}

      {currentView === 'detail' && selectedLeadId && (
        <Layout onShowLeads={handleShowLeads} onShowMap={handleShowMap}>
          <LeadDetail leadId={selectedLeadId} onBack={handleBackToList} />
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
