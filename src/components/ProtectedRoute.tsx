import React from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { LandingPage } from './LandingPage'
import { Impressum, Datenschutz, AGB } from './LegalPages'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()
  const [hash, setHash] = React.useState<string>(typeof window !== 'undefined' ? window.location.hash : '')

  React.useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Anwendung...</p>
        </div>
      </div>
    )
  }

  // Nicht eingeloggt – Legal Pages über Hash direkt zugänglich, sonst LandingPage
  if (!user) {
    const h = hash.replace('#/', '')
    if (h === 'impressum') return <Impressum />
    if (h === 'datenschutz') return <Datenschutz />
    if (h === 'agb') return <AGB />
    return <LandingPage />
  }

  // Eingeloggt - zeige geschützte Inhalte
  return <>{children}</>
} 