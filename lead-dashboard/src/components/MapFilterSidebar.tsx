import React from 'react'
import { useMapFilters } from '../hooks/useMapFilters'
import { LEAD_STATUS_OPTIONS } from '../types/leads'
import type { Lead, LeadStatus } from '../types/leads'

interface MapFilterSidebarProps {
  isOpen: boolean
  onToggle: () => void
  leads: Lead[]
  onFilteredLeadsChange: (leads: Lead[]) => void
}

export function MapFilterSidebar({ isOpen, onToggle, leads, onFilteredLeadsChange }: MapFilterSidebarProps) {
  const { filters, filteredLeads, updateFilter, resetFilters, toggleStatus, filterStats } = useMapFilters(leads)

  React.useEffect(() => {
    onFilteredLeadsChange(filteredLeads)
  }, [filteredLeads, onFilteredLeadsChange])

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-[999] md:hidden" onClick={onToggle} />}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-[1000] transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{filterStats.filtered} von {filterStats.total}</span>
            <button onClick={onToggle} className="md:hidden p-1 text-gray-400 hover:text-gray-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-full pb-20">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Suche</label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              placeholder="Name, E-Mail, Adresse..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="space-y-2">
          {LEAD_STATUS_OPTIONS.map((status) => {
            const count = leads.filter((lead) => lead.lead_status === status.value).length
            const isSelected = filters.statuses.includes(status.value)
            return (
              <button
                key={status.value}
                onClick={() => toggleStatus(status.value as LeadStatus)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{status.label}</span>
                <span className="text-xs">{count}</span>
              </button>
            )
          })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up</label>
            <div className="space-y-1">
              {[
                { value: null, label: 'Alle' },
                { value: true, label: 'Follow-up erforderlich' },
                { value: false, label: 'Kein Follow-up' }
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => updateFilter('followUp', option.value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    filters.followUp === option.value ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Erstellungsdatum</label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.dateRange.start || ''}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Von"
              />
              <input
                type="date"
                value={filters.dateRange.end || ''}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Bis"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Angebote</label>
            <div className="space-y-1">
              {[
                { value: null, label: 'Alle' },
                { value: true, label: 'Mit Angeboten' },
                { value: false, label: 'Ohne Angebote' }
              ].map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => updateFilter('hasOffers', option.value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    filters.hasOffers === option.value ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <input
              type="text"
              value={filters.region || ''}
              onChange={(e) => updateFilter('region', e.target.value || null)}
              placeholder="Wien, Salzburg, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">{filterStats.activeFilters} Filter aktiv</span>
            <button onClick={resetFilters} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Zurücksetzen
            </button>
          </div>
          <div className="text-xs text-gray-500">
            {filteredLeads.filter((lead) => lead.lat && lead.lng).length} Leads auf Karte sichtbar
          </div>
        </div>
      </div>
    </>
  )
}
