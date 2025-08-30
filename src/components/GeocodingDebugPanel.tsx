import React, { useState } from 'react'
import { useGeocoding } from '../hooks/useGeocoding'

export function GeocodingDebugPanel() {
  const [leadId, setLeadId] = useState('test-id')
  const [address, setAddress] = useState('Stephansplatz 1, 1010 Wien')
  const { isGeocoding, geocodingResults, clearResults } = useGeocoding()

  const triggerWebhook = async () => {
    clearResults()
    await fetch(import.meta.env.VITE_GEOCODING_WEBHOOK_URL || 'http://localhost:5678/webhook/geocode-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: leadId, address }),
    })
  }

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Geocoding Debug</h3>
      <div className="space-y-2">
        <input
          className="w-full border rounded px-2 py-1"
          placeholder="Lead ID"
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
        />
        <input
          className="w-full border rounded px-2 py-1"
          placeholder="Adresse"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            onClick={triggerWebhook}
            disabled={isGeocoding}
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Webhook testen
          </button>
          <button
            onClick={clearResults}
            className="px-3 py-1 bg-gray-100 text-gray-800 rounded"
          >
            Ergebnisse leeren
          </button>
        </div>
        {geocodingResults.length > 0 && (
          <pre className="mt-3 text-sm bg-gray-50 p-2 rounded overflow-auto max-h-48">
            {JSON.stringify(geocodingResults, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}


