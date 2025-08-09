export interface GeocodingResult {
  success: boolean
  lead_id: string
  coordinates?: {
    lat: number
    lng: number
  }
  error?: string
}

export class GeocodingService {
  private readonly webhookUrl: string

  constructor(webhookUrl?: string) {
    const envUrl = (import.meta as any)?.env?.VITE_GEOCODING_WEBHOOK_URL as string | undefined
    this.webhookUrl = webhookUrl || envUrl || 'https://n8n.beautomated.at/webhook/geocode-lead'
  }

  async geocodeLead(leadId: string, address: string): Promise<GeocodingResult> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          address: address,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Geocoding failed:', error)
      return {
        success: false,
        lead_id: leadId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async batchGeocode(leads: Array<{ id: string; address: string }>): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = []

    for (const lead of leads) {
      const result = await this.geocodeLead(lead.id, lead.address)
      results.push(result)
      // Einfaches Rate Limiting
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    return results
  }
}

export const geocodingService = new GeocodingService()


