import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import { LeadDetail } from './components/LeadDetail'
import type { Lead } from './types/leads'

type View = 'list' | 'detail'

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

  return (
    <Layout>
      <div className="space-y-6">
        {currentView === 'list' && (
          <>
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
              <p className="text-gray-600">
                Verwalten Sie Ihre Vertriebskontakte
              </p>
            </div>

            {/* Lead Liste */}
            <LeadList onLeadClick={handleLeadClick} />
          </>
        )}

        {currentView === 'detail' && selectedLeadId && (
          <LeadDetail 
            leadId={selectedLeadId}
            onBack={handleBackToList}
          />
        )}
      </div>
    </Layout>
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
