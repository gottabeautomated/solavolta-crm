import React, { useMemo, useState } from 'react'
// Fallback-Dialog ohne externe Abhängigkeit
function Dialog({ open, onClose, children, className }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string }) {
  if (!open) return null
  return (
    <div className={className || ''}>
      {children}
    </div>
  )
}
Dialog.Panel = function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
} as any
Dialog.Title = function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
} as any
import { useAuthContext } from '../contexts/AuthContext'
import { sendInvitation, type InvitationRole } from '../lib/invitations'

export interface Props {
  isOpen: boolean
  onClose: () => void
}

export function InviteUserDialog({ isOpen, onClose }: Props) {
  const { activeTenantId, tenants } = useAuthContext()
  const tenantName = useMemo(() => tenants.find(t => t.id === activeTenantId)?.name || 'Unbekannt', [tenants, activeTenantId])

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitationRole>('viewer')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setEmail('')
    setRole('viewer')
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeTenantId) {
      setError('Kein aktiver Mandant gewählt')
      return
    }
    if (!email.trim()) {
      setError('E-Mail ist erforderlich')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await sendInvitation({ tenant_id: activeTenantId, email, role, tenant_name: tenantName })
      resetForm()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Einladung fehlgeschlagen'
      setError(message)
      if (import.meta.env.DEV) console.error('sendInvitation failed', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onClose={() => !submitting && onClose()} className="relative z-[2000]">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded bg-white p-5 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-gray-900">Nutzer einladen</Dialog.Title>
          <p className="mt-1 text-sm text-gray-600">Mandant: <span className="font-medium">{tenantName}</span></p>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as InvitationRole)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={submitting}
              >
                <option value="viewer">Viewer</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Sende…' : 'Einladung senden'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}



