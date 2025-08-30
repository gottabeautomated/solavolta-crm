import React from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface AssignLeadDialogProps {
  leadId: string
  isOpen: boolean
  onClose: () => void
  onAssigned?: (newTenantId: string) => void
}

export function AssignLeadDialog({ leadId, isOpen, onClose, onAssigned }: AssignLeadDialogProps) {
  const { tenants, activeTenantId } = useAuthContext()
  const [targetTenantId, setTargetTenantId] = React.useState<string>('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (isOpen) {
      const fallback = tenants.find(t => t.id !== activeTenantId)?.id || tenants[0]?.id || ''
      setTargetTenantId(fallback)
      setError(null)
    }
  }, [isOpen, tenants, activeTenantId])

  if (!isOpen) return null

  const submit = async () => {
    if (!targetTenantId || targetTenantId === activeTenantId) {
      setError('Bitte einen anderen Mandanten wählen')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ tenant_id: targetTenantId } as any)
        .eq('id', leadId)
        .select('id, tenant_id')
        .single()
      if (error) throw error
      onAssigned?.(data?.tenant_id as string)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Zuweisung fehlgeschlagen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => !submitting && onClose()} />
      <div className="relative z-10 bg-white rounded shadow-lg p-4 w-full max-w-md">
        <h3 className="text-lg font-semibold">Lead zuordnen</h3>
        <p className="mt-1 text-sm text-gray-600">Wähle den Ziel‑Mandanten aus.</p>
        <div className="mt-4">
          <label className="block text-sm text-gray-700 mb-1">Ziel‑Mandant</label>
          <select
            value={targetTenantId}
            onChange={(e) => setTargetTenantId(e.target.value)}
            className="w-full border rounded px-2 py-2 text-sm"
            disabled={submitting}
          >
            {tenants
              .filter(t => t.id !== activeTenantId)
              .map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
              ))}
          </select>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="px-3 py-2 border rounded text-sm">Abbrechen</button>
          <button onClick={submit} disabled={submitting || !targetTenantId} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
            {submitting ? 'Zuweisen…' : 'Zuweisen'}
          </button>
        </div>
      </div>
    </div>
  )
}


