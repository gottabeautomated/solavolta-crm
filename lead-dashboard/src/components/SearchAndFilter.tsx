import { useState, useMemo, useEffect } from 'react'
import { SearchInput } from './ui/SearchInput'
import { useDebounce } from '../hooks/useDebounce'
import type { LeadFilters, LeadStatus } from '../types/leads'
import { LEAD_STATUS_OPTIONS, ARCHIVE_FILTER_OPTIONS } from '../types/leads'
import { getStatusColor } from '../lib/mapUtils'

interface SearchAndFilterProps {
  onFiltersChange: (filters: LeadFilters) => void
  disabled?: boolean
}

export function SearchAndFilter({ onFiltersChange, disabled = false }: SearchAndFilterProps) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<LeadStatus | null>(null)
  const [archivedMode, setArchivedMode] = useState<'exclude_archived' | 'only_archived' | 'include_archived'>('exclude_archived')

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
    result.archivedMode = archivedMode

    return result
  }, [debouncedSearch, status, archivedMode])

  // Notify parent when filters change - mit useEffect statt direktem Call
  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  // Reset all filters
  const handleReset = () => {
    setSearch('')
    setStatus(null)
    setArchivedMode('exclude_archived')
  }

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0

  // Transform options for dropdown (nur Status für Chips-Tooltips)
  const statusOptions = LEAD_STATUS_OPTIONS.map(status => ({ value: status, label: status }))

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
      <div className="hidden md:block">
        {/* Status- & Archiv-Chips kompakt in einer Reihe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pr-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`px-2.5 py-1 rounded-full border text-xs ${status === null ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setStatus(null)}
                disabled={disabled}
              >
                Alle
              </button>
              {LEAD_STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`pl-2 pr-2.5 py-1 rounded-full border text-xs flex items-center gap-1 ${status === (s.value as LeadStatus) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setStatus(prev => prev === (s.value as LeadStatus) ? null : (s.value as LeadStatus))}
                  disabled={disabled}
                  title={s.label}
                >
                  <span aria-hidden className="inline-block" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getStatusColor(s.value) }} />
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mx-2 h-5 w-px bg-gray-200" aria-hidden />
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-1">Archiv</span>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-full border text-xs ${archivedMode === 'exclude_archived' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setArchivedMode('exclude_archived')}
                disabled={disabled}
              >
                Ohne
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-full border text-xs ${archivedMode === 'include_archived' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setArchivedMode('include_archived')}
                disabled={disabled}
              >
                Einbl.
              </button>
              <button
                type="button"
                className={`px-2.5 py-1 rounded-full border text-xs ${archivedMode === 'only_archived' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setArchivedMode('only_archived')}
                disabled={disabled}
              >
                Nur Arch.
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Archiv-Filter separat entfällt, da neben Status integriert */}

      {/* Filters - Mobile: nur Status/Archiv-Leiste oben, daher hier nichts weiter */}

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

            {filters.archivedMode && filters.archivedMode !== 'exclude_archived' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Archiv: {filters.archivedMode === 'only_archived' ? 'Nur Archivierte' : 'Archivierte einblenden'}
                <button
                  onClick={() => setArchivedMode('exclude_archived')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
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
