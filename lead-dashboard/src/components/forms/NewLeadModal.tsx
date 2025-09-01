import React, { useState } from 'react'
import { useLeads } from '../../hooks/useLeads'
import type { Lead } from '../../types/leads'

interface NewLeadModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (lead: Lead) => void
}

export function NewLeadModal({ isOpen, onClose, onCreated }: NewLeadModalProps) {
  const { createLead, fetchLeads } = useLeads()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleClose = () => {
    setName('')
    setEmail('')
    setPhone('')
    setAddress('')
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const { data, error } = await createLead({
        name: name || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        lead_status: 'Neu' as any,
        contact_type: null,
        phone_status: null,
        documentation: null,
        doc_link: null,
        exported_to_sap: false,
        lat: null,
        lng: null,
        offers: [],
        next_action: null,
        next_action_date: null,
        next_action_time: null,
        preliminary_offer: false,
        lost_reason: null,
      } as any)

      if (error) throw error
      if (data) {
        onCreated?.(data)
        // Liste schnell aktualisieren (optimistic Update existiert, hier zusätzlich hart revalidieren)
        try { fetchLeads() } catch {}
        handleClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Neuen Lead erstellen</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input className="mt-1 w-full border rounded px-2 py-1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail</label>
              <input className="mt-1 w-full border rounded px-2 py-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Telefon</label>
              <input className="mt-1 w-full border rounded px-2 py-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <textarea className="mt-1 w-full border rounded px-2 py-1" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2">
          <button onClick={handleClose} className="px-3 py-1 rounded border">Abbrechen</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">
            {saving ? 'Speichert...' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}


