import React, { useState, useMemo } from 'react'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { LeadStatusBadge, Badge } from './ui/Badge'
import { SearchAndFilter } from './SearchAndFilter'
import { NewLeadModal } from './forms/NewLeadModal'
import { DebugPanel } from './ui/DebugPanel'
import type { Lead, LeadFilters } from '../types/leads'

interface LeadListProps {
  onLeadClick?: (lead: Lead) => void
}

export function LeadList({ onLeadClick }: LeadListProps) {
  const { leads, loading, error, refetch } = useLeads()
  const [activeFilters, setActiveFilters] = useState<LeadFilters>({})
  const [showNewModal, setShowNewModal] = useState(false)

  // Client-side filtering - verhindert API-Calls bei jeder Filter-Änderung
  const filteredLeads = useMemo(() => {
    if (!leads) return []

    return leads.filter(lead => {
      // Search Filter
      if (activeFilters.search) {
        const searchTerm = activeFilters.search.toLowerCase()
        const searchableText = [
          lead.name,
          lead.email,
          lead.phone,
          lead.address
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Status Filter
      if (activeFilters.status && lead.lead_status !== activeFilters.status) {
        return false
      }

      // Follow-up Filter
      if (activeFilters.follow_up !== undefined && lead.follow_up !== activeFilters.follow_up) {
        return false
      }

      // SAP Export Filter
      if (activeFilters.exported_to_sap !== undefined && lead.exported_to_sap !== activeFilters.exported_to_sap) {
        return false
      }

      // Contact Type Filter
      if (activeFilters.contact_type && lead.contact_type !== activeFilters.contact_type) {
        return false
      }

      // Phone Status Filter
      if (activeFilters.phone_status && lead.phone_status !== activeFilters.phone_status) {
        return false
      }

      return true
    })
  }, [leads, activeFilters])

  // Filter-Handler - Stable callback
  const handleFiltersChange = React.useCallback((filters: LeadFilters) => {
    setActiveFilters(filters)
  }, [])

  if (loading) {
    return <LoadingSpinner text="Lade Leads..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden der Leads"
        message={error}
        onRetry={refetch}
      />
    )
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Leads vorhanden</h3>
          <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Lead.</p>
          <button onClick={() => setShowNewModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Lead erstellen
          </button>
        </div>
      </div>
      <NewLeadModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onCreated={(lead)=> onLeadClick?.(lead)} />
    )
  }

  // Show "no results" when all leads are filtered out
  if (filteredLeads.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search and Filter */}
        <SearchAndFilter 
          onFiltersChange={handleFiltersChange}
          disabled={loading}
        />

        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Leads gefunden</h3>
            <p className="text-gray-600 mb-4">
              Keine Leads entsprechen den aktuellen Filterkriterien.
            </p>
            <button 
              onClick={() => setActiveFilters({})}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Filter zurücksetzen
            </button>
                  </div>
      </div>

      {/* Debug Panel - nur in Development */}
      <DebugPanel 
        allLeads={leads || []}
        filteredLeads={filteredLeads}
        activeFilters={activeFilters}
        isVisible={process.env.NODE_ENV === 'development'}
      />
    </div>
  )
}

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <SearchAndFilter 
        onFiltersChange={handleFiltersChange}
        disabled={loading}
      />

      {/* Lead List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Leads ({filteredLeads.length} von {leads.length})
            </h2>
            <div className="flex items-center space-x-3">
              {Object.keys(activeFilters).length > 0 && (
                <button 
                  onClick={() => setActiveFilters({})}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Filter zurücksetzen
                </button>
              )}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => refetch()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Aktualisieren
                </button>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  + Neuer Lead
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kontakt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Erstellt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr 
                  key={lead.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onLeadClick?.(lead)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.name || 'Unbekannt'}
                      </div>
                      {lead.follow_up && (
                        <Badge variant="warning" size="sm">Follow-up</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{lead.phone || '-'}</div>
                    <div className="text-sm text-gray-500">{lead.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <LeadStatusBadge status={lead.lead_status} />
                    {lead.contact_type && (
                      <div className="mt-1">
                        <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {lead.address || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {lead.phone && (
                      <a 
                        href={`tel:${lead.phone}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📞 Anrufen
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden">
          {filteredLeads.map((lead) => (
            <div 
              key={lead.id}
              className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onLeadClick?.(lead)}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {lead.name || 'Unbekannt'}
                  </h3>
                  <p className="text-sm text-gray-500">{lead.phone}</p>
                </div>
                <LeadStatusBadge status={lead.lead_status} />
              </div>
              
              {lead.address && (
                <p className="text-sm text-gray-600 mb-2 truncate">{lead.address}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {lead.contact_type && (
                    <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                  )}
                  {lead.follow_up && (
                    <Badge variant="warning" size="sm">Follow-up</Badge>
                  )}
                </div>
                
                {lead.phone && (
                  <a 
                    href={`tel:${lead.phone}`}
                    className="text-blue-600 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    📞 Anrufen
                  </a>
                )}
              </div>
              
              <div className="mt-2 text-xs text-gray-400">
                {new Date(lead.created_at).toLocaleDateString('de-DE')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <NewLeadModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onCreated={(lead)=> onLeadClick?.(lead)} />
  )
}