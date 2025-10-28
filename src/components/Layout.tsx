import React, { useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { IconButton } from './ui/IconButton'
import { NotificationCenter } from './NotificationCenter'
import { DiagnosticPanel } from './DiagnosticPanel'
import { Badge } from './ui/Badge'

function InviteUserButton() {
  const [open, setOpen] = React.useState(false)
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<'owner'|'admin'|'agent'|'viewer'>('agent')
  const { activeTenantId, tenants } = useAuthContext()

  const currentRole = React.useMemo(() => tenants.find(t => t.id === activeTenantId)?.role, [tenants, activeTenantId])
  const canInvite = currentRole === 'owner' || currentRole === 'admin'

  const handleInvite = async () => {
    if (!activeTenantId || !email) return
    const token = crypto.randomUUID()
    const { supabase } = await import('../lib/supabase')
    const { error } = await supabase
      .from('invitations')
      .insert([{ tenant_id: activeTenantId, email, role, token, invited_by: (await supabase.auth.getUser()).data.user?.id }])
    if (!error) {
      setOpen(false)
      setEmail('')
      // TODO: optional n8n Webhook zum E-Mail Versand triggern
    } else {
      if (import.meta.env.DEV) console.error('Invitation failed', error)
    }
  }

  if (!canInvite) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm px-2 py-1 bg-blue-600 text-white rounded-md">Nutzer einladen</button>
      {open && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-md shadow-lg p-4 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Einladung erstellen</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">E-Mail</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded px-2 py-1" placeholder="user@example.com" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Rolle</label>
                <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full border rounded px-2 py-1">
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="agent">Agent</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setOpen(false)} className="px-3 py-1 rounded border">Abbrechen</button>
              <button onClick={handleInvite} className="px-3 py-1 rounded bg-blue-600 text-white">Einladung senden</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface LayoutProps {
  children: React.ReactNode
  onShowDashboard?: () => void
  onShowLeads?: () => void
  onShowMap?: () => void
  activeView?: 'dashboard' | 'list' | 'map' | 'followups' | 'detail' | 'legal' | 'docs' | 'impressum' | 'datenschutz' | 'agb'
  onShowDocs?: () => void
}

export function Layout({ children, onShowDashboard, onShowLeads, onShowMap, onShowDocs, activeView = 'dashboard' }: LayoutProps) {
  const { user, signOut, tenants, activeTenantId, setActiveTenantId } = useAuthContext()
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      if (import.meta.env.DEV) console.error('Fehler beim Abmelden:', error)
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
            <h1 className="text-xl font-semibold text-gray-900">BeAutomated × SolaVolta</h1>

            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden sm:flex space-x-2">
                <button
                  onClick={onShowDashboard}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='dashboard' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={onShowLeads}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='list' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Leads
                </button>
                <button
                  onClick={onShowMap}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='map' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Karte
                </button>
                <button
                  onClick={() => { if (onShowDocs) onShowDocs(); else window.location.hash = '#/docs' }}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='docs' ? 'text-gray-900 bg-gray-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Handbuch
                </button>
              </nav>

              {/* Tenant Switcher (nur anzeigen, wenn mehr als 1 Tenant) */}
              <div className="hidden sm:flex items-center">
                {tenants.length > 1 && (
                  <select
                    value={activeTenantId || ''}
                    onChange={(e) => setActiveTenantId(e.target.value)}
                    className="text-sm border-gray-300 rounded-md px-2 py-1 mr-2"
                    title="Mandant wechseln"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

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
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge
                    variant="warning"
                    size="sm"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-xs"
                  >
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 z-50 w-[32rem] max-h-[70vh] overflow-hidden">
                    <NotificationCenter onClose={()=>setShowNotifications(false)} />
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                {/* Invite only for admins/owners - hier simpel immer anzeigen; Rollenprüfung kann ergänzt werden */}
                <InviteUserButton />
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
          <div className="px-4 py-2 space-x-2">
            <button
              onClick={onShowDashboard}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='dashboard' ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}
            >Dashboard</button>
            <button
              onClick={onShowLeads}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='list' ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}
            >Leads</button>
            <button
              onClick={onShowMap}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='map' ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}
            >Karte</button>
            <button
              onClick={() => { if (onShowDocs) onShowDocs(); else window.location.hash = '#/docs' }}
              className={`px-3 py-2 rounded-md text-sm font-medium ${activeView==='docs' ? 'text-gray-900 bg-gray-100' : 'text-gray-500'}`}
            >Handbuch</button>
          </div>
        </div>
      </header>

      {/* Notification Panel integrated next to bell via dropdown above */}

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="text-xs text-gray-500">
          <span className={`${activeView==='dashboard' ? 'text-gray-900' : 'hover:text-gray-700 cursor-pointer'}`} onClick={onShowDashboard}>Dashboard</span>
          {activeView==='list' && <span> / Leads</span>}
          {activeView==='map' && <span> / Karte</span>}
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">{children}</main>

      {import.meta.env?.MODE === 'development' && (
        <DiagnosticPanel />
      )}

      {/* Footer mit Legal-Links */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-600 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} BeAutomated × SolaVolta</div>
          <div className="flex items-center gap-4">
            <a href="#/impressum" className="hover:text-gray-800">Impressum</a>
            <a href="#/datenschutz" className="hover:text-gray-800">Datenschutz</a>
            <a href="#/agb" className="hover:text-gray-800">AGB</a>
          </div>
        </div>
      </footer>
    </div>
  )
} 