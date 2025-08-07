import React from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { Login } from './Login'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()

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

  // Nicht eingeloggt - zeige Login
  if (!user) {
    return <Login />
  }

  // Eingeloggt - zeige geschützte Inhalte
  return <>{children}</>
} 