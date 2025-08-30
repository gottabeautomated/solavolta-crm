import React from 'react'
import { useAppStartup } from '../hooks/useAppStartup'
import { clearAppCaches } from '../lib/cacheBuster'

interface AppStartupProps {
  children: React.ReactNode
}

export function AppStartup({ children }: AppStartupProps) {
  const { isReady, error, isFirstLoad } = useAppStartup()

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-5xl mb-4">🚨</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">App-Start fehlgeschlagen</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => clearAppCaches({ clearAuth: false, reload: true })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cache leeren & neu starten
            </button>
            <button
              onClick={() => clearAppCaches({ clearAuth: true, reload: true })}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Komplett zurücksetzen
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isFirstLoad ? 'Initialisiere App...' : 'App wird geladen...'}
          </p>
          {isFirstLoad && (
            <p className="mt-2 text-sm text-gray-500">Erste Ausführung - Cache wird optimiert</p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}



