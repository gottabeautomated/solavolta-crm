import React from 'react'
import type { Lead, LeadFilters } from '../../types/leads'

interface DebugPanelProps {
  allLeads: Lead[]
  filteredLeads: Lead[]
  activeFilters: LeadFilters
  isVisible?: boolean
}

export function DebugPanel({ 
  allLeads, 
  filteredLeads, 
  activeFilters, 
  isVisible = false 
}: DebugPanelProps) {
  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h4 className="font-bold text-yellow-400 mb-2">🐛 Debug Info</h4>
      
      <div className="space-y-2">
        <div>
          <strong>Leads:</strong> {allLeads.length} total, {filteredLeads.length} filtered
        </div>
        
        <div>
          <strong>Active Filters:</strong> {Object.keys(activeFilters).length}
        </div>
        
        {Object.entries(activeFilters).map(([key, value]) => (
          <div key={key} className="text-yellow-200">
            {key}: {String(value)}
          </div>
        ))}
        
        <div className="pt-2 border-t border-gray-600">
          <strong>Re-render Count:</strong> {React.useRef(0).current++}
        </div>
      </div>
    </div>
  )
} 