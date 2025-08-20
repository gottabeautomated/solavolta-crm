import { useEffect, useState } from 'react'
import { AuthProvider } from './contexts/SimpleAuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppStartup } from './components/AppStartup'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import { LeadDetail } from './components/LeadDetail'
// import { StatusOverview } from './components/status/StatusOverview'
// import { GeocodingDebugPanel } from './components/GeocodingDebugPanel'
import { FollowupDashboard } from './components/FollowupDashboard'
import { EnhancedFollowUpsPanel } from './components/EnhancedFollowUpsPanel'
import { EnhancedFollowUpForm } from './components/EnhancedFollowUpForm'
import { useEnhancedFollowUps } from './hooks/useEnhancedFollowUps'
import { DailyDashboard } from './components/DailyDashboard'
import { DashboardOverview } from './components/DashboardOverview'
import { SolaVoltaCalculatorPanel } from './components/SolaVoltaCalculatorPanel'
import { MapView } from './components/MapView'
import type { Lead } from './types/leads'
import { Impressum, Datenschutz, AGB } from './components/LegalPages'
import { CookieConsent } from './components/CookieConsent'
import { eventBus } from './lib/eventBus'

type View = 'dashboard' | 'list' | 'detail' | 'map' | 'followups' | 'impressum' | 'datenschutz' | 'agb'

function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [showCreateEfu, setShowCreateEfu] = useState(false)
  const { create, refetch } = useEnhancedFollowUps()

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setCurrentView('detail')
  }

  const handleOpenLeadById = (leadId: string) => {
    setSelectedLeadId(leadId)
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

  const handleShowDashboard = () => {
    setCurrentView('dashboard')
    setSelectedLeadId(null)
  }

  const handleShowLeads = () => {
    setCurrentView('list')
    setSelectedLeadId(null)
  }

  // Legal links aus dem Footer (hash-basiert)
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.replace('#/', '')
      if (h === 'impressum') setCurrentView('impressum')
      else if (h === 'datenschutz') setCurrentView('datenschutz')
      else if (h === 'agb') setCurrentView('agb')
    }
    window.addEventListener('hashchange', onHashChange)
    const onOpenLead = (e: Event) => {
      const detail = (e as CustomEvent).detail as { leadId: string; section?: string | null }
      setSelectedLeadId(detail.leadId)
      setCurrentView('detail')
      // TODO: pass section to LeadDetail via props/state if needed
    }
    eventBus.addEventListener('open-lead-detail', onOpenLead as EventListener)
    onHashChange()
    return () => { window.removeEventListener('hashchange', onHashChange); eventBus.removeEventListener('open-lead-detail', onOpenLead as EventListener) }
  }, [])

  return (
    <>
      {(currentView === 'dashboard' || currentView === 'list') && (
        <Layout onShowDashboard={handleShowDashboard} onShowLeads={handleShowLeads} onShowMap={handleShowMap} activeView={currentView}>
          <div className="space-y-6">
            {currentView === 'dashboard' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Daily Operations</h1>
                    <p className="text-gray-600">Überblick und schnelle Aktionen</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('followups')}
                    className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                  >
                    Follow-ups
                  </button>
                </div>
                <DashboardOverview onOpenLead={handleOpenLeadById} />
                <SolaVoltaCalculatorPanel />
              </>
            )}

            {currentView === 'list' && (
              <>
                <h2 className="text-xl font-semibold">Leads</h2>
                <LeadList onLeadClick={handleLeadClick} />
              </>
            )}
            {/* Schlanke Dashboard-Header-Aktionen */}
            <div className="flex items-center justify-end gap-2">
              <button onClick={handleShowMap} className="px-3 py-2 text-sm bg-green-600 text-white rounded">Karte</button>
              <button onClick={() => setCurrentView('followups')} className="px-3 py-2 text-sm bg-amber-600 text-white rounded">Follow-ups</button>
            </div>

            {/* Status-Kacheln optional ausgeblendet; Leads entfallen auf Dashboard */}
          </div>
        </Layout>
      )}

      {currentView === 'detail' && selectedLeadId && (
        <Layout onShowDashboard={handleShowDashboard} onShowLeads={handleShowLeads} onShowMap={handleShowMap} activeView="detail">
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

      {currentView === 'followups' && (
        <Layout onShowDashboard={handleShowDashboard} onShowLeads={handleShowLeads} onShowMap={handleShowMap} activeView="followups">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={() => setShowCreateEfu(true)}
                className="inline-flex items-center px-5 py-3 bg-blue-600 text-white text-sm font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Neues Follow-up
              </button>
            </div>
            {/* Daily Operations Overview */}
            <div className="mb-6">
              <DashboardOverview onOpenLead={handleOpenLeadById} />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <FollowupDashboard onLeadClick={handleOpenLeadById} />
              <DailyDashboard onOpenLead={handleOpenLeadById} />
            </div>
            <EnhancedFollowUpsPanel onOpenLead={handleOpenLeadById} />
          </div>
  <EnhancedFollowUpForm
    open={showCreateEfu}
    onClose={() => setShowCreateEfu(false)}
    onSave={async (payload) => { await create(payload); await refetch() }}
    initial={null}
  />
        </Layout>
      )}

      {currentView === 'impressum' && (
        <Layout onShowLeads={handleShowLeads} onShowMap={handleShowMap}>
          <Impressum />
        </Layout>
      )}
      {currentView === 'datenschutz' && (
        <Layout onShowLeads={handleShowLeads} onShowMap={handleShowMap}>
          <Datenschutz />
        </Layout>
      )}
      {currentView === 'agb' && (
        <Layout onShowLeads={handleShowLeads} onShowMap={handleShowMap}>
          <AGB />
        </Layout>
      )}
    </>
  )
}

function App() {
  return (
    <AppStartup>
      <AuthProvider>
        <ProtectedRoute>
          <>
            <Dashboard />
            <CookieConsent />
          </>
        </ProtectedRoute>
      </AuthProvider>
    </AppStartup>
  )
}

export default App
