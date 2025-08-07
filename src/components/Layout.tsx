import React, { useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/status/useNotifications'
import { IconButton } from './ui/IconButton'
import { Badge } from './ui/Badge'

interface LayoutProps {
  children: React.ReactNode
  onShowLeads?: () => void
  onShowMap?: () => void
}

export function Layout({ children, onShowLeads, onShowMap }: LayoutProps) {
  const { user, signOut } = useAuthContext()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Lead Dashboard</h1>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden sm:flex space-x-4">
                <button
                  onClick={onShowLeads}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Leads
                </button>
                <button
                  onClick={onShowMap}
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Karte
                </button>
              </nav>

              {/* Notifications */}
              <div className="relative">
                <IconButton
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 00-6 6v3.75l-2.25 2.25V19.5A2.25 2.25 0 004.5 21.75h10.5A2.25 2.25 0 0017.25 19.5v-1.5L15 13.5V9.75a6 6 0 00-6-6z" />
                    </svg>
                  }
                  onClick={() => setShowNotifications(!showNotifications)}
                  variant="ghost"
                  size="sm"
                />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Badge
                    variant="warning"
                    size="sm"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs"
                  >
                    {notifications.filter(n => !n.is_read).length}
                  </Badge>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isLoggingOut ? 'Abmelden...' : 'Abmelden'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t">
          <div className="px-4 py-2 space-x-4">
            <button
              onClick={onShowLeads}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Leads
            </button>
            <button
              onClick={onShowMap}
              className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Karte
            </button>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute top-16 right-4 w-80 bg-white shadow-lg rounded-md border z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Benachrichtigungen</h3>
              <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-700">
                Alle als gelesen markieren
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">Keine Benachrichtigungen</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.created_at).toLocaleString('de-DE')}
                        </p>
                      </div>
                      {!notification.is_read && <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  )
} 