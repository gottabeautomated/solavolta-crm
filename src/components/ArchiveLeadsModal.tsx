import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Modal } from './ui/Modal'
import { useAuthContext } from '../contexts/AuthContext'
import type { Lead, LeadStatus } from '../types/leads'
import { LEAD_STATUS_OPTIONS } from '../types/leads'

interface ArchiveLeadsModalProps {
  isOpen: boolean
  onClose: () => void
  onArchived: () => void
}

export function ArchiveLeadsModal({ isOpen, onClose, onArchived }: ArchiveLeadsModalProps) {
  const { activeTenantId } = useAuthContext()
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [archiving, setArchiving] = useState(false)

  // Safety: ensure leads is always an array
  const safeLeads = Array.isArray(leads) ? leads : []

  // Lade Leads älter als 1 Monat
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setLeads([])
      setSelectedLeads(new Set())
      setLoading(false)
      return
    }

    if (activeTenantId) {
      loadOldLeads()
    } else {
      console.warn('⚠️ ArchiveLeadsModal opened without activeTenantId')
      setLeads([])
      setSelectedLeads(new Set())
      setLoading(false)
    }
  }, [isOpen, activeTenantId])

  const loadOldLeads = async () => {
    if (!activeTenantId) {
      console.warn('⚠️ loadOldLeads: No activeTenantId')
      return
    }
    
    setLoading(true)
    try {
      // Datum vor 1 Monat
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      console.log('🔍 Loading old leads before:', oneMonthAgo.toISOString())

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .eq('archived', false)
        .lt('created_at', oneMonthAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Loaded leads:', data?.length || 0)
      const leadData = Array.isArray(data) ? data : []
      setLeads(leadData)
      // Alle standardmäßig auswählen
      setSelectedLeads(new Set(leadData.map(l => l.id)))
    } catch (err) {
      console.error('❌ Fehler beim Laden der Leads:', err)
      setLeads([]) // Ensure it's always an array
      setSelectedLeads(new Set())
    } finally {
      setLoading(false)
    }
  }

  const toggleLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const toggleAll = () => {
    if (selectedLeads.size === safeLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(safeLeads.map(l => l.id)))
    }
  }

  const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: newStatus,
          status_since: new Date().toISOString()
        })
        .eq('id', leadId)

      if (error) throw error

      // Update local state
      setLeads(safeLeads.map(lead => 
        lead.id === leadId 
          ? { ...lead, lead_status: newStatus } 
          : lead
      ))
    } catch (err) {
      console.error('Fehler beim Status-Update:', err)
    }
  }

  const handleArchive = async () => {
    if (selectedLeads.size === 0) return

    const confirmed = window.confirm(
      `${selectedLeads.size} Leads archivieren?\n\nArchivierte Leads können später wieder aktiviert werden.`
    )
    if (!confirmed) return

    setArchiving(true)
    try {
      const { error } = await supabase
        .from('leads')
        .update({ archived: true })
        .in('id', Array.from(selectedLeads))

      if (error) throw error

      alert(`✅ ${selectedLeads.size} Leads erfolgreich archiviert!`)
      onArchived()
      onClose()
    } catch (err) {
      console.error('Fehler beim Archivieren:', err)
      alert('❌ Fehler beim Archivieren der Leads')
    } finally {
      setArchiving(false)
    }
  }

  // Early return if modal is closed
  if (!isOpen) return null

  const getStatusBadgeColor = (status: LeadStatus) => {
    const colors: Record<string, string> = {
      'Neu': 'bg-blue-100 text-blue-800',
      'Kontaktiert': 'bg-purple-100 text-purple-800',
      'Qualifiziert': 'bg-green-100 text-green-800',
      'Angebot erstellt': 'bg-yellow-100 text-yellow-800',
      'Verhandlung': 'bg-orange-100 text-orange-800',
      'Gewonnen': 'bg-green-100 text-green-800',
      'Verloren': 'bg-red-100 text-red-800',
      'Warteliste': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">🗄️ Leads archivieren</h2>
              <p className="text-sm text-gray-600 mt-1">
                Leads älter als 1 Monat · {safeLeads.length} gefunden
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Lade Leads...</p>
            </div>
          ) : safeLeads.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">🎉 Keine Leads zum Archivieren!</p>
              <p className="text-sm text-gray-500 mt-2">
                Alle Leads sind aktuell oder bereits archiviert.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === safeLeads.length}
                    onChange={toggleAll}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 font-medium text-gray-900">
                    Alle auswählen ({selectedLeads.size} / {safeLeads.length})
                  </span>
                </label>
                <span className="text-sm text-gray-600">
                  {selectedLeads.size} ausgewählt
                </span>
              </div>

              {/* Lead List */}
              <div className="space-y-3">
                {safeLeads.map(lead => (
                  <div
                    key={lead.id}
                    className={`p-4 border rounded-lg transition-all ${
                      selectedLeads.has(lead.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead.id)}
                        onChange={() => toggleLead(lead.id)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />

                      {/* Lead Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {lead.name || 'Unbekannt'}
                          </h3>
                          <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString('de-DE')}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          {lead.email && <span>📧 {lead.email}</span>}
                          {lead.phone && <span>📱 {lead.phone}</span>}
                        </div>

                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-600">Status:</label>
                          <select
                            value={lead.lead_status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                            className={`text-xs px-2 py-1 rounded border-0 font-medium ${getStatusBadgeColor(lead.lead_status)}`}
                          >
                            {LEAD_STATUS_OPTIONS.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {leads.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleArchive}
              disabled={selectedLeads.size === 0 || archiving}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {archiving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Archiviere...</span>
                </>
              ) : (
                <>
                  <span>🗄️</span>
                  <span>{selectedLeads.size} Leads archivieren</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}

