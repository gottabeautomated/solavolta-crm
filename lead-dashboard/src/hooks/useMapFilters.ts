import { useState, useMemo, useCallback } from 'react'
import type { Lead, LeadStatus } from '../types/leads'

export interface MapFilters {
  statuses: LeadStatus[]
  followUp: boolean | null
  dateRange: { start: string | null; end: string | null }
  hasOffers: boolean | null
  searchTerm: string
  region: string | null
}

const initialFilters: MapFilters = {
  statuses: [],
  followUp: null,
  dateRange: { start: null, end: null },
  hasOffers: null,
  searchTerm: '',
  region: null
}

export function useMapFilters(leads: Lead[]) {
  const [filters, setFilters] = useState<MapFilters>(initialFilters)

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.statuses.length > 0 && lead.lead_status && !filters.statuses.includes(lead.lead_status)) {
        return false
      }
      if (filters.followUp !== null && lead.follow_up !== filters.followUp) {
        return false
      }
      if (filters.dateRange.start || filters.dateRange.end) {
        const leadDate = new Date(lead.created_at)
        if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) return false
        if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) return false
      }
      if (filters.hasOffers !== null) {
        const hasAnyOffer = lead.offer_pv || lead.offer_storage || lead.offer_backup || lead.tvp
        if (hasAnyOffer !== filters.hasOffers) return false
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const searchableText = [lead.name, lead.email, lead.phone, lead.address, lead.documentation]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!searchableText.includes(searchLower)) return false
      }
      if (filters.region && lead.address) {
        if (!lead.address.toLowerCase().includes(filters.region.toLowerCase())) return false
      }
      return true
    })
  }, [leads, filters])

  const updateFilter = useCallback(<K extends keyof MapFilters>(key: K, value: MapFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(initialFilters), [])

  const toggleStatus = useCallback((status: LeadStatus) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((s) => s !== status)
        : [...prev.statuses, status]
    }))
  }, [])

  const filterStats = useMemo(() => {
    const total = leads.length
    const filtered = filteredLeads.length
    const activeFilters = [
      filters.statuses.length > 0,
      filters.followUp !== null,
      filters.dateRange.start || filters.dateRange.end,
      filters.hasOffers !== null,
      filters.searchTerm.length > 0,
      filters.region !== null
    ].filter(Boolean).length
    return { total, filtered, activeFilters }
  }, [leads.length, filteredLeads.length, filters])

  return { filters, filteredLeads, updateFilter, resetFilters, toggleStatus, filterStats }
}
