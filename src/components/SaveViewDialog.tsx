import React from 'react'
import { Modal } from './ui/Modal'
import { useSavedViews } from '../hooks/useSavedViews'
import { useDashboard } from '../contexts/DashboardContext'
import { useAuthContext } from '../contexts/AuthContext'

export function SaveViewDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useSavedViews()
  const { filters } = useDashboard()
  const { tenants, activeTenantId } = useAuthContext()
  const role = React.useMemo(()=>tenants.find(t=>t.id===activeTenantId)?.role, [tenants, activeTenantId])
  const canShare = role === 'owner' || role === 'admin'
  const [name, setName] = React.useState('')
  const [isDefault, setIsDefault] = React.useState(false)
  const [shared, setShared] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string|null>(null)

  const handleSave = async () => {
    if (!name.trim()) { setError('Bitte Namen angeben'); return }
    setLoading(true)
    setError(null)
    try {
      await create(name.trim(), filters as any, isDefault, shared && canShare)
      onClose()
    } catch (e:any) {
      setError(e?.message || 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !loading && onClose()}>
      <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
        <div className="text-lg font-semibold text-gray-900">View speichern</div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="z. B. Heute Hohe Priorität" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e)=>setIsDefault(e.target.checked)} />
            Als Default setzen
          </label>
          <label className={`flex items-center gap-2 text-sm ${!canShare?'opacity-60 pointer-events-none':''}`}>
            <input type="checkbox" checked={shared && canShare} onChange={(e)=>setShared(e.target.checked)} />
            Mit allen Nutzer:innen im Mandanten teilen (Admin)
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 text-sm rounded border" onClick={onClose} disabled={loading}>Abbrechen</button>
            <button className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-60" onClick={handleSave} disabled={loading}>{loading?'Speichere…':'Speichern'}</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}


