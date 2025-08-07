import React, { useState, useMemo, useEffect } from 'react'
import { SearchInput } from './ui/SearchInput'
import { FilterDropdown } from './ui/FilterDropdown'
import { FilterToggle } from './ui/FilterToggle'
import { useDebounce } from '../hooks/useDebounce'
import type { LeadFilters, LeadStatus, ContactType } from '../types/leads'
import { LEAD_STATUS_OPTIONS, CONTACT_TYPE_OPTIONS } from '../types/leads'

interface SearchAndFilterProps {
  onFiltersChange: (filters: LeadFilters) => void
  disabled?: boolean
}

export function SearchAndFilter({ onFiltersChange, disabled = false }: SearchAndFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LeadStatus | null>(null)
  const [contactType, setContactType] = useState<ContactType | null>(null)
  const [followUp, setFollowUp] = useState<boolean | null>(null)
  const [exportedToSap, setExportedToSap] = useState<boolean | null>(null)

  // Debounce search input - verhindert zu häufige Updates
  const debouncedSearch = useDebounce(search, 300)

  // Build filters object - nur wenn sich etwas ändert
  const filters = useMemo((): LeadFilters => {
    const result: LeadFilters = {}
    
    if (debouncedSearch.trim()) {
      result.search = debouncedSearch.trim()
    }
    if (status) {
      result.status = status
    }
    if (contactType) {
      result.contact_type = contactType
    }
    if (followUp !== null) {
      result.follow_up = followUp
    }
    if (exportedToSap !== null) {
      result.exported_to_sap = exportedToSap
    }

    return result
  }, [debouncedSearch, status, contactType, followUp, exportedToSap])

  // Notify parent when filters change - mit useEffect statt direktem Call
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Reset all filters
  const handleReset = () => {
    setSearch('')
    setStatus(null)
    setContactType(null)
    setFollowUp(null)
    setExportedToSap(null)
  }

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0

  // Transform options for dropdown
  const statusOptions = LEAD_STATUS_OPTIONS.map(status => ({
    value: status,
    label: status
  }))

  const contactTypeOptions = CONTACT_TYPE_OPTIONS.map(type => ({
    value: type,
    label: type
  }))

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter & Suche</h3>
        
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 transition-colors"
          >
            Alle Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nach Name, Adresse oder E-Mail suchen..."
          disabled={disabled}
        />
      </div>

      {/* Filters - Desktop */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4">
        <FilterDropdown
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(value) => setStatus(value as LeadStatus)}
          placeholder="Alle Status"
          disabled={disabled}
        />
        
        <FilterDropdown
          label="Kontakttyp"
          value={contactType}
          options={contactTypeOptions}
          onChange={(value) => setContactType(value as ContactType)}
          placeholder="Alle Typen"
          disabled={disabled}
        />
        
        <FilterToggle
          label="Follow-up"
          value={followUp}
          onChange={setFollowUp}
          disabled={disabled}
        />
        
        <FilterToggle
          label="SAP Export"
          value={exportedToSap}
          onChange={setExportedToSap}
          disabled={disabled}
        />
      </div>

      {/* Filters - Mobile */}
      <div className="md:hidden space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FilterDropdown
            label="Status"
            value={status}
            options={statusOptions}
            onChange={(value) => setStatus(value as LeadStatus)}
            placeholder="Alle"
            disabled={disabled}
          />
          
          <FilterDropdown
            label="Kontakttyp"
            value={contactType}
            options={contactTypeOptions}
            onChange={(value) => setContactType(value as ContactType)}
            placeholder="Alle"
            disabled={disabled}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FilterToggle
            label="Follow-up"
            value={followUp}
            onChange={setFollowUp}
            disabled={disabled}
          />
          
          <FilterToggle
            label="SAP Export"
            value={exportedToSap}
            onChange={setExportedToSap}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600">Aktive Filter:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Suche: "{filters.search}"
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {filters.status}
                <button
                  onClick={() => setStatus(null)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.contact_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Typ: {filters.contact_type}
                <button
                  onClick={() => setContactType(null)}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.follow_up !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Follow-up: {filters.follow_up ? 'Ja' : 'Nein'}
                <button
                  onClick={() => setFollowUp(null)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.exported_to_sap !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                SAP: {filters.exported_to_sap ? 'Exportiert' : 'Nicht exportiert'}
                <button
                  onClick={() => setExportedToSap(null)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
