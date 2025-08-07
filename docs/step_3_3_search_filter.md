# Step 3.3: Such- und Filterfunktion

## 🎯 Ziel
Such- und Filterfunktionen für die Lead-Liste implementieren: Suchleiste, Status-Filter, Follow-up Filter und weitere Filteroptionen.

## 📋 Checkliste

### Suchfunktion
- [x] Suchleiste Komponente erstellen
- [x] Live-Search mit Debouncing
- [x] Suche nach Name, Adresse, E-Mail
- [x] Search-Icon und Clear-Button

### Filter-Komponenten
- [x] Status-Filter Dropdown
- [x] Follow-up Filter Toggle
- [x] SAP-Export Status Filter
- [x] Kontakttyp Filter
- [x] Filter-Reset Funktionalität

### UI/UX
- [x] Filter-Bar Layout
- [x] Active Filter Anzeige
- [x] Mobile-optimierte Filter
- [x] Animations und Transitions

### Integration
- [x] Filter mit useLeads Hook verbinden
- [x] URL State Management (optional)
- [x] Performance optimieren

## 🔧 Cursor Commands

### Dateien erstellen
```bash
touch src/components/SearchAndFilter.tsx
touch src/components/ui/SearchInput.tsx
touch src/components/ui/FilterDropdown.tsx
touch src/components/ui/FilterToggle.tsx
touch src/hooks/useDebounce.ts
```

## 📁 Zu erstellende Dateien

### `src/hooks/useDebounce.ts`
```typescript
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### `src/components/ui/SearchInput.tsx`
```typescript
import React, { useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Suchen...",
  disabled = false 
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg 
          className="h-5 w-5 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={`
          block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md
          leading-5 bg-white placeholder-gray-500 text-gray-900
          focus:outline-none focus:placeholder-gray-400 focus:ring-1 
          focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${isFocused ? 'ring-1 ring-blue-500 border-blue-500' : ''}
        `}
        placeholder={placeholder}
      />
      
      {value && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={handleClear}
            disabled={disabled}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
```

### `src/components/ui/FilterDropdown.tsx`
```typescript
import React, { useState, useRef, useEffect } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterDropdownProps {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Alle",
  disabled = false
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          relative w-full bg-white border border-gray-300 rounded-md shadow-sm 
          pl-3 pr-10 py-2 text-left cursor-default focus:outline-none 
          focus:ring-1 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${isOpen ? 'ring-1 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
            className={`
              w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
              ${!value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
            `}
          >
            {placeholder}
          </button>
          
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors
                ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### `src/components/ui/FilterToggle.tsx`
```typescript
import React from 'react'

interface FilterToggleProps {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  disabled?: boolean
}

export function FilterToggle({ 
  label, 
  value, 
  onChange, 
  disabled = false 
}: FilterToggleProps) {
  const options = [
    { value: null, label: 'Alle', color: 'bg-gray-100 text-gray-700' },
    { value: true, label: 'Ja', color: 'bg-green-100 text-green-700' },
    { value: false, label: 'Nein', color: 'bg-red-100 text-red-700' }
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={`
              flex-1 px-3 py-1 text-xs font-medium rounded transition-all duration-200
              disabled:cursor-not-allowed disabled:opacity-50
              ${value === option.value ? option.color : 'text-gray-600 hover:text-gray-900'}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### `src/components/SearchAndFilter.tsx`
```typescript
import React, { useState, useMemo } from 'react'
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

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300)

  // Build filters object
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

  // Notify parent when filters change
  React.useEffect(() => {
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
          onChange={setStatus}
          placeholder="Alle Status"
          disabled={disabled}
        />
        
        <FilterDropdown
          label="Kontakttyp"
          value={contactType}
          options={contactTypeOptions}
          onChange={setContactType}
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
            onChange={setStatus}
            placeholder="Alle"
            disabled={disabled}
          />
          
          <FilterDropdown
            label="Kontakttyp"
            value={contactType}
            options={contactTypeOptions}
            onChange={setContactType}
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
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">Aktive Filter:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Suche: "{filters.search}"
              </span>
            )}
            
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Status: {filters.status}
              </span>
            )}
            
            {filters.contact_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Typ: {filters.contact_type}
              </span>
            )}
            
            {filters.follow_up !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Follow-up: {filters.follow_up ? 'Ja' : 'Nein'}
              </span>
            )}
            
            {filters.exported_to_sap !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                SAP: {filters.exported_to_sap ? 'Exportiert' : 'Nicht exportiert'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

### `src/components/LeadList.tsx` (erweitern)
```typescript
// Am Anfang der Datei hinzufügen:
import { SearchAndFilter } from './SearchAndFilter'
import type { LeadFilters } from '../types/leads'

// In der LeadList Komponente:
export function LeadList({ onLeadClick }: LeadListProps) {
  const { leads, loading, error, refetch, fetchLeads } = useLeads()

  // Filter-Handler
  const handleFiltersChange = (filters: LeadFilters) => {
    fetchLeads(filters)
  }

  if (loading) {
    return <LoadingSpinner text="Lade Leads..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden der Leads"
        message={error}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <SearchAndFilter 
        onFiltersChange={handleFiltersChange}
        disabled={loading}
      />

      {/* Rest of the component stays the same... */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* ... existing code ... */}
      </div>
    </div>
  )
}
```

## 🧪 Tests

### 1. Entwicklungsserver starten
```bash
npm run dev
```

### 2. Such- und Filterfunktionen testen
- [ ] **Suchleiste**: Text eingeben → Live-Suche funktioniert
- [ ] **Status-Filter**: Dropdown öffnen, Status wählen → Leads werden gefiltert
- [ ] **Kontakttyp-Filter**: Verschiedene Typen auswählen
- [ ] **Follow-up Toggle**: Zwischen Alle/Ja/Nein wechseln
- [ ] **SAP-Export Toggle**: Zwischen Alle/Ja/Nein wechseln
- [ ] **Filter Reset**: "Alle Filter zurücksetzen" → alle Filter werden geleert
- [ ] **Active Filter Display**: Aktive Filter werden angezeigt

### 3. Mobile Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# Mobile View: Filter sollten gestapelt angezeigt werden
```

### 4. Debouncing testen
```bash
# Schnell Text in Suchleiste eingeben
# Suche sollte erst nach 300ms starten (nicht bei jedem Buchstaben)
```

### 5. Kombinierte Filter testen
```bash
# Mehrere Filter gleichzeitig aktivieren:
# - Suche: "Max"
# - Status: "Neu"
# - Follow-up: "Ja"
# Sollte nur passende Leads anzeigen
```

## ✅ Definition of Done
- [x] Suchleiste mit Live-Search funktioniert
- [x] Debouncing verhindert zu häufige API-Calls
- [x] Status-Filter Dropdown funktional
- [x] Kontakttyp-Filter funktional
- [x] Follow-up und SAP-Export Toggles funktional
- [x] Filter-Reset Button funktioniert
- [x] Active Filter werden angezeigt
- [x] Mobile Layout ist responsive
- [x] Kombinierte Filter funktionieren korrekt
- [x] Performance ist gut (keine unnötigen Re-renders)

## 🔗 Nächster Step
**Step 4.1:** Lead-Detailansicht (Read-Only)

---

## 📝 Notes & Troubleshooting

**Problem:** Suche ist zu langsam
**Lösung:** Debounce-Delay erhöhen (z.B. auf 500ms)

**Problem:** Filter werden nicht angewendet
**Lösung:** useLeads Hook prüfen, fetchLeads Funktion mit Filtern aufrufen

**Problem:** Dropdown schließt nicht
**Lösung:** Click-Outside Handler in FilterDropdown prüfen

**Problem:** Mobile Filter überlappen
**Lösung:** Tailwind Grid-Klassen und Breakpoints validieren

**Problem:** Performance Issues bei vielen Filtern
**Lösung:** useMemo und useCallback richtig einsetzen 