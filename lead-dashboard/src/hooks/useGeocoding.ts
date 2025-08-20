import { useState, useCallback } from 'react'
import { geocodingService, type GeocodingResult } from '../lib/geocodingService'
import type { Lead } from '../types/leads'

export function useGeocoding() {
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodingResults, setGeocodingResults] = useState<GeocodingResult[]>([])

  const geocodeSingleLead = useCallback(async (lead: Lead): Promise<GeocodingResult> => {
    if (!lead.address) {
      return {
        success: false,
        lead_id: lead.id,
        error: 'No address provided',
      }
    }

    setIsGeocoding(true)

    try {
      const result = await geocodingService.geocodeLead(lead.id, lead.address)
      setGeocodingResults((prev) => [...prev, result])
      return result
    } catch (error) {
      const errorResult: GeocodingResult = {
        success: false,
        lead_id: lead.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      setGeocodingResults((prev) => [...prev, errorResult])
      return errorResult
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  const geocodeMultipleLeads = useCallback(async (leads: Lead[]): Promise<GeocodingResult[]> => {
    const leadsWithAddress = leads.filter((lead) => lead.address && !lead.lat && !lead.lng)

    if (leadsWithAddress.length === 0) {
      return []
    }

    setIsGeocoding(true)
    setGeocodingResults([])

    try {
      const leadData = leadsWithAddress.map((lead) => ({
        id: lead.id,
        address: lead.address!,
      }))

      const results = await geocodingService.batchGeocode(leadData)
      setGeocodingResults(results)
      return results
    } catch (error) {
      if (import.meta.env.DEV) console.error('Batch geocoding failed:', error)
      return []
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setGeocodingResults([])
  }, [])

  return {
    isGeocoding,
    geocodingResults,
    geocodeSingleLead,
    geocodeMultipleLeads,
    clearResults,
  }
}


