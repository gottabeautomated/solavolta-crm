import React from 'react'
import { useMap } from 'react-leaflet'
import type { Lead, LeadStatus } from '../types/leads'
import { LEAD_STATUS_OPTIONS } from '../types/leads'
import { calculateBounds, AUSTRIA_CENTER } from '../lib/mapUtils'

interface MapControlsProps {
  leads: Lead[]
  onFilterChange?: (status: LeadStatus | null) => void
  currentFilter?: LeadStatus | null
}

export function MapControls({ leads, onFilterChange, currentFilter }: MapControlsProps) {
  const map = useMap()

  const handleFitBounds = () => {
    const bounds = calculateBounds(leads)
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] })
    } else {
      map.setView(AUSTRIA_CENTER, 7)
    }
  }

  const handleResetView = () => {
    map.setView(AUSTRIA_CENTER, 7)
  }

  const handleStatusFilter = (status: LeadStatus | null) => {
    onFilterChange?.(status)
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 space-y-3 max-w-xs">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Ansicht</h4>
        <div className="flex space-x-2">
          <button onClick={handleFitBounds} className="flex-1 text-xs bg-blue-600 text-white px-2 py-1 rounded">
            Alle Leads
          </button>
          <button onClick={handleResetView} className="flex-1 text-xs bg-gray-600 text-white px-2 py-1 rounded">
            Österreich
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">Filter</h4>
        <div className="space-y-1">
          <button
            onClick={() => handleStatusFilter(null)}
            className={`w-full text-xs px-2 py-1 rounded text-left transition-colors ${
              currentFilter === null ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle Status ({leads.length})
          </button>
          {LEAD_STATUS_OPTIONS.map((status) => {
            const count = leads.filter((lead) => lead.lead_status === status).length
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`w-full text-xs px-2 py-1 rounded text-left transition-colors ${
                  currentFilter === status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status} ({count})
              </button>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        {leads.filter((lead) => lead.lat && lead.lng).length} von {leads.length} Leads auf Karte
      </div>
    </div>
  )
}
