import React from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { LandingPage } from './LandingPage'
import { clearAppCaches } from '../lib/cacheBuster'
import { ErrorBoundary } from './ui/ErrorBoundary'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { 
    user, 
    loading, 
    tenantLoading,
    tenants, 
    activeTenantId, 
    error,
    setActiveTenantId,
    createDefaultTenant,
    retryLoadTenants,
    membershipsLoaded,
    signOut,
  } = useAuthContext()

  const [busy, setBusy] = React.useState(false)
  const [showDetails, setShowDetails] = React.useState(false)

  // DEV: konsolenfreundliche State-Logs
  React.useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[ProtectedRoute]', { loading, tenantLoading, membershipsLoaded, user: !!user, tenants: tenants.length, activeTenantId, error })
    }
  }, [loading, tenantLoading, membershipsLoaded, user, tenants.length, activeTenantId, error])

  const handleClearCaches = async () => {
    setBusy(true)
    await clearAppCaches({ clearAuth: false, reload: true, logDetails: import.meta.env.DEV })
  }

  const handleFixActiveTenant = () => {
    try { localStorage.removeItem('activeTenantId') } catch {}
    retryLoadTenants()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">App wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LandingPage />

  if (tenantLoading || !membershipsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Mandanten werden geladen...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fehler beim Laden</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button onClick={retryLoadTenants} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Erneut versuchen</button>
            <button onClick={() => window.location.reload()} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Seite neu laden</button>
            <button disabled={busy} onClick={handleClearCaches} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50">Cache leeren</button>
            <button onClick={()=>signOut().catch(()=>{})} className="w-full px-4 py-2 bg-white border rounded-lg">Abmelden</button>
          </div>
          <button onClick={()=>setShowDetails(s=>!s)} className="mt-3 text-xs text-gray-500 underline">Details {showDetails?'verbergen':'anzeigen'}</button>
          {showDetails && (
            <pre className="mt-2 p-2 bg-gray-100 rounded text-left text-xs overflow-auto max-h-48">{JSON.stringify({ loading, tenantLoading, membershipsLoaded, activeTenantId, tenants }, null, 2)}</pre>
          )}
        </div>
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-gray-400 text-5xl mb-4">🏢</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Kein Mandant vorhanden</h2>
          <p className="text-gray-600 mb-6 text-sm">Du bist noch keinem Mandanten zugeordnet. Du kannst einen neuen Arbeitsbereich erstellen oder warten bis du eingeladen wirst.</p>
          <div className="space-y-3">
            <button onClick={createDefaultTenant} className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Neuen Arbeitsbereich erstellen</button>
            <button onClick={retryLoadTenants} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Erneut laden</button>
            <button disabled={busy} onClick={handleClearCaches} className="w-full px-4 py-2 bg-white border rounded-lg disabled:opacity-50">Cache leeren</button>
            <button onClick={()=>signOut().catch(()=>{})} className="w-full px-4 py-2 bg-white border rounded-lg">Abmelden</button>
          </div>
          <p className="text-xs text-gray-500 mt-4">Eingeloggt als: {user.email}</p>
        </div>
      </div>
    )
  }

  const activeIsValid = !!activeTenantId && tenants.some(t => t.id === activeTenantId)
  if (!activeIsValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-gray-400 text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Mandant auswählen</h2>
          <p className="text-gray-600 mb-4">Bitte wähle einen Mandanten aus:</p>
          <div className="space-y-2">
            {tenants.map(t => (
              <button key={t.id} onClick={()=>setActiveTenantId(t.id)} className="w-full p-3 text-left bg-white border rounded-lg hover:bg-gray-50 shadow-sm">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-gray-500">Rolle: {t.role}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <button onClick={handleFixActiveTenant} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Aktive Auswahl zurücksetzen</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
