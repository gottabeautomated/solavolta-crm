import useSWR, { type SWRConfiguration } from 'swr'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface LeadIndexRow {
	id: string
	name: string | null
	phone: string | null
	address: string | null
	user_id: string | null
}

export function useLeadIndex(config?: SWRConfiguration) {
	const { activeTenantId, membershipsLoaded, user, tenants } = useAuth()
	const role = tenants.find(t => t.id===activeTenantId)?.role || null
	const isAdmin = role==='owner' || role==='admin' || role==='sales_admin'
	const key = activeTenantId && membershipsLoaded ? ['view', 'lead_index', activeTenantId, isAdmin ? 'all' : (user?.id||'')] : null
	const { data, error, isLoading, mutate } = useSWR<LeadIndexRow[]>(
		key,
		async () => {
			let query = supabase
				.from('leads')
				.select('id,name,phone,address,user_id')
				.eq('tenant_id', activeTenantId as string)
			if (!isAdmin && user?.id) query = query.eq('user_id', user.id)
			const { data, error } = await query
			if (error) throw error
			return (data || []) as LeadIndexRow[]
		},
		{ revalidateOnFocus: false, shouldRetryOnError: true, ...config }
	)
	const byId = new Map<string, LeadIndexRow>()
	;(data || []).forEach(r => byId.set(r.id, r))
	return { rows: data || [], byId, loading: isLoading, error, revalidate: mutate }
}

export function extractZipFromAddress(address?: string | null): string | null {
	if (!address) return null
	const m = address.match(/\b\d{4,5}\b/)
	return m ? m[0] : null
}

export function normalize(text?: string | null): string {
	return (text || '')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
}

export function fuzzyIncludes(haystack: string, needle: string): boolean {
	if (!needle) return true
	if (haystack.includes(needle)) return true
	// Basic fuzzy: check each token includes; tolerate one typo for short terms
	if (needle.length >= 4) {
		const window = 1
		let mismatches = 0
		let j = 0
		for (let i = 0; i < haystack.length && j < needle.length; i++) {
			if (haystack[i] === needle[j]) j++
			else mismatches++
			if (mismatches > window && i - j > window) return false
		}
		return j >= needle.length - 1
	}
	return false
}


