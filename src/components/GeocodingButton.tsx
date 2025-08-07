import React from 'react'
import { useGeocoding } from '../hooks/useGeocoding'
import type { Lead } from '../types/leads'

interface GeocodingButtonProps {
  lead: Lead
  onSuccess?: (result: any) => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
}

export function GeocodingButton({
  lead,
  onSuccess,
  variant = 'secondary',
  size = 'sm',
}: GeocodingButtonProps) {
  const { isGeocoding, geocodeSingleLead } = useGeocoding()

  const handleGeocode = async () => {
    const result = await geocodeSingleLead(lead)

    if (result.success && onSuccess) {
      onSuccess(result)
    }
  }

  const canGeocode = lead.address && !lead.lat && !lead.lng

  if (!canGeocode) {
    return null
  }

  const baseClasses = 'inline-flex items-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'

  return (
    <button
      onClick={handleGeocode}
      disabled={isGeocoding}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${isGeocoding ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isGeocoding ? (
        <>
          <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Geocoding...
        </>
      ) : (
        <>
          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Koordinaten finden
        </>
      )}
    </button>
  )
}


