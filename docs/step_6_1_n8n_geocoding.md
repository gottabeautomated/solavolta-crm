# Step 6.1: n8n Geocoding-Workflow (Automationen)

## 🎯 Ziel
Automatisches Geocoding-System mit n8n implementieren, das neue Leads überwacht und automatisch Koordinaten für Adressen generiert.

## 📋 Checkliste

### n8n Setup
- [ ] n8n installieren und konfigurieren
- [ ] Supabase Connection einrichten
- [ ] OpenStreetMap API Integration
- [ ] Webhook-Endpunkte konfigurieren

### Geocoding-Workflow
- [ ] Lead-Monitor Trigger erstellen
- [ ] Adress-Validierung implementieren
- [ ] OpenStreetMap API Calls
- [ ] Koordinaten-Update in Supabase
- [ ] Error Handling & Logging

### Zusätzliche Automationen
- [ ] Follow-up Reminder System
- [ ] Lead-Status Change Notifications
- [ ] Daily Report Generator
- [ ] Backup & Monitoring

### Integration
- [ ] Webhook-Trigger in Lead-Management
- [ ] Manual Geocoding Button
- [ ] Batch-Processing für bestehende Leads
- [ ] Status-Tracking für Geocoding

## 🔧 Voraussetzungen

### n8n Installation
```bash
# Option 1: Docker (Empfohlen)
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

# Option 2: npm
npm install n8n -g
n8n start

# Option 3: npx (für Testing)
npx n8n
```

### Environment Setup
```bash
# .env für n8n
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=jonas
N8N_BASIC_AUTH_PASSWORD=LeadDashboard2024!
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
```

## 📁 n8n Workflow Konfigurationen

### 1. **Geocoding-Workflow** (`geocoding-workflow.json`)
```json
{
  "name": "Lead Geocoding Automation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "geocode-lead",
        "responseMode": "responseNode"
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "name": "Webhook Trigger"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.address }}",
              "rightValue": "",
              "operator": {
                "type": "string",
                "operation": "notEmpty"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [460, 300],
      "name": "Address Valid?"
    },
    {
      "parameters": {
        "url": "=https://nominatim.openstreetmap.org/search?format=json&q={{ encodeURIComponent($json.address) }}&countrycodes=at&limit=1",
        "options": {
          "headers": {
            "User-Agent": "Lead-Dashboard-Geocoding/1.0"
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [680, 200],
      "name": "OpenStreetMap Geocoding"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.length }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [900, 200],
      "name": "Coordinates Found?"
    },
    {
      "parameters": {
        "operation": "update",
        "table": "leads",
        "updateKey": "id",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "lat": "={{ parseFloat($json[0].lat) }}",
            "lng": "={{ parseFloat($json[0].lon) }}"
          }
        },
        "additionalFields": {}
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1120, 100],
      "name": "Update Lead Coordinates",
      "credentials": {
        "supabaseApi": {
          "id": "supabase-connection",
          "name": "Supabase Lead Dashboard"
        }
      }
    },
    {
      "parameters": {
        "operation": "update",
        "table": "leads",
        "updateKey": "id",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "geocoding_status": "failed",
            "geocoding_error": "No coordinates found for address"
          }
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1120, 300],
      "name": "Mark Geocoding Failed",
      "credentials": {
        "supabaseApi": {
          "id": "supabase-connection",
          "name": "Supabase Lead Dashboard"
        }
      }
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"success\": true, \"lead_id\": \"{{ $('Webhook Trigger').first().json.lead_id }}\", \"coordinates\": { \"lat\": {{ $json.lat }}, \"lng\": {{ $json.lng }} } }"
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1340, 100],
      "name": "Success Response"
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={ \"success\": false, \"lead_id\": \"{{ $('Webhook Trigger').first().json.lead_id }}\", \"error\": \"Geocoding failed\" }"
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [1340, 300],
      "name": "Error Response"
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Address Valid?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Address Valid?": {
      "main": [
        [
          {
            "node": "OpenStreetMap Geocoding",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenStreetMap Geocoding": {
      "main": [
        [
          {
            "node": "Coordinates Found?",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Coordinates Found?": {
      "main": [
        [
          {
            "node": "Update Lead Coordinates",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Mark Geocoding Failed",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Update Lead Coordinates": {
      "main": [
        [
          {
            "node": "Success Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Mark Geocoding Failed": {
      "main": [
        [
          {
            "node": "Error Response",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "1",
  "id": "geocoding-workflow"
}
```

### 2. **Batch Geocoding Workflow** (`batch-geocoding.json`)
```json
{
  "name": "Batch Geocoding for Existing Leads",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "value": "0 2 * * *"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300],
      "name": "Daily at 2 AM"
    },
    {
      "parameters": {
        "operation": "select",
        "table": "leads",
        "conditions": {
          "conditions": [
            {
              "column": "lat",
              "condition": "isNull"
            },
            {
              "column": "address",
              "condition": "isNotNull"
            }
          ],
          "combinator": "and"
        },
        "options": {
          "limit": 50
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 300],
      "name": "Get Leads without Coordinates",
      "credentials": {
        "supabaseApi": {
          "id": "supabase-connection",
          "name": "Supabase Lead Dashboard"
        }
      }
    },
    {
      "parameters": {},
      "type": "n8n-nodes-base.splitInBatches",
      "typeVersion": 2,
      "position": [680, 300],
      "name": "Process in Batches"
    },
    {
      "parameters": {
        "url": "=https://nominatim.openstreetmap.org/search?format=json&q={{ encodeURIComponent($json.address) }}&countrycodes=at&limit=1",
        "options": {
          "headers": {
            "User-Agent": "Lead-Dashboard-Batch-Geocoding/1.0"
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.1,
      "position": [900, 300],
      "name": "Geocode Address"
    },
    {
      "parameters": {
        "jsCode": "// Rate limiting - wait 1 second between requests\nawait new Promise(resolve => setTimeout(resolve, 1000));\n\nconst geocodeResult = $input.first().json;\nconst leadData = $('Process in Batches').first().json;\n\nif (geocodeResult && geocodeResult.length > 0) {\n  const result = geocodeResult[0];\n  return {\n    id: leadData.id,\n    lat: parseFloat(result.lat),\n    lng: parseFloat(result.lon),\n    geocoding_status: 'success',\n    geocoding_error: null\n  };\n} else {\n  return {\n    id: leadData.id,\n    lat: null,\n    lng: null,\n    geocoding_status: 'failed',\n    geocoding_error: 'No coordinates found'\n  };\n}"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1120, 300],
      "name": "Process Result"
    },
    {
      "parameters": {
        "operation": "update",
        "table": "leads",
        "updateKey": "id",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "lat": "={{ $json.lat }}",
            "lng": "={{ $json.lng }}",
            "geocoding_status": "={{ $json.geocoding_status }}",
            "geocoding_error": "={{ $json.geocoding_error }}"
          }
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [1340, 300],
      "name": "Update Lead",
      "credentials": {
        "supabaseApi": {
          "id": "supabase-connection",
          "name": "Supabase Lead Dashboard"
        }
      }
    }
  ],
  "connections": {
    "Daily at 2 AM": {
      "main": [
        [
          {
            "node": "Get Leads without Coordinates",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Get Leads without Coordinates": {
      "main": [
        [
          {
            "node": "Process in Batches",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process in Batches": {
      "main": [
        [
          {
            "node": "Geocode Address",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Geocode Address": {
      "main": [
        [
          {
            "node": "Process Result",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Result": {
      "main": [
        [
          {
            "node": "Update Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "active": true,
  "settings": {
    "executionOrder": "v1"
  }
}
```

## 📦 Supabase Schema-Erweiterungen

### Geocoding-Status Felder hinzufügen
```sql
-- Erweitere die leads Tabelle um Geocoding-Status
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoding_status text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoding_error text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_leads_geocoding_status ON leads(geocoding_status);

-- Update bestehende Leads ohne Koordinaten
UPDATE leads 
SET geocoding_status = 'pending' 
WHERE lat IS NULL AND lng IS NULL AND address IS NOT NULL;

-- Führe Database Function für automatische Geocoding-Trigger
CREATE OR REPLACE FUNCTION trigger_geocoding()
RETURNS TRIGGER AS $$
BEGIN
    -- Nur triggern wenn sich die Adresse geändert hat oder neue erstellt wurde
    IF (TG_OP = 'INSERT' AND NEW.address IS NOT NULL AND NEW.lat IS NULL) 
       OR (TG_OP = 'UPDATE' AND OLD.address IS DISTINCT FROM NEW.address AND NEW.address IS NOT NULL) THEN
        
        NEW.geocoding_status = 'pending';
        NEW.geocoding_error = NULL;
        NEW.geocoded_at = NULL;
        
        -- Reset coordinates when address changes
        IF TG_OP = 'UPDATE' AND OLD.address IS DISTINCT FROM NEW.address THEN
            NEW.lat = NULL;
            NEW.lng = NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger erstellen
DROP TRIGGER IF EXISTS trigger_lead_geocoding ON leads;
CREATE TRIGGER trigger_lead_geocoding
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_geocoding();
```

## 🔧 Frontend-Integration

### n8n Geocoding Service
```typescript
// src/lib/geocodingService.ts
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

  constructor(webhookUrl: string = 'http://localhost:5678/webhook/geocode-lead') {
    this.webhookUrl = webhookUrl
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
          address: address
        })
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
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async batchGeocode(leads: Array<{ id: string; address: string }>): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = []
    
    // Process in batches to avoid overwhelming the API
    for (const lead of leads) {
      const result = await this.geocodeLead(lead.id, lead.address)
      results.push(result)
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return results
  }
}

export const geocodingService = new GeocodingService()
```

### Geocoding Hook
```typescript
// src/hooks/useGeocoding.ts
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
        error: 'No address provided'
      }
    }

    setIsGeocoding(true)
    
    try {
      const result = await geocodingService.geocodeLead(lead.id, lead.address)
      setGeocodingResults(prev => [...prev, result])
      return result
    } catch (error) {
      const errorResult: GeocodingResult = {
        success: false,
        lead_id: lead.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      setGeocodingResults(prev => [...prev, errorResult])
      return errorResult
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  const geocodeMultipleLeads = useCallback(async (leads: Lead[]): Promise<GeocodingResult[]> => {
    const leadsWithAddress = leads.filter(lead => lead.address && !lead.lat && !lead.lng)
    
    if (leadsWithAddress.length === 0) {
      return []
    }

    setIsGeocoding(true)
    setGeocodingResults([])
    
    try {
      const leadData = leadsWithAddress.map(lead => ({
        id: lead.id,
        address: lead.address!
      }))
      
      const results = await geocodingService.batchGeocode(leadData)
      setGeocodingResults(results)
      return results
    } catch (error) {
      console.error('Batch geocoding failed:', error)
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
    clearResults
  }
}
```

### Geocoding UI Components
```typescript
// src/components/GeocodingButton.tsx
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
  size = 'sm' 
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
  const variantClasses = variant === 'primary' 
    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-2 text-sm'

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
```

### Batch Geocoding Panel
```typescript
// src/components/BatchGeocodingPanel.tsx
import React, { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import { useGeocoding } from '../hooks/useGeocoding'
import { LoadingSpinner } from './ui/LoadingSpinner'

export function BatchGeocodingPanel() {
  const { leads } = useLeads()
  const { isGeocoding, geocodingResults, geocodeMultipleLeads, clearResults } = useGeocoding()
  const [showResults, setShowResults] = useState(false)

  const leadsWithoutCoordinates = leads.filter(lead => 
    lead.address && !lead.lat && !lead.lng
  )

  const handleBatchGeocode = async () => {
    setShowResults(true)
    clearResults()
    await geocodeMultipleLeads(leadsWithoutCoordinates)
  }

  const successCount = geocodingResults.filter(r => r.success).length
  const failureCount = geocodingResults.filter(r => !r.success).length

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Batch Geocoding</h3>
          <p className="text-sm text-gray-600">
            Koordinaten für {leadsWithoutCoordinates.length} Leads ohne Koordinaten generieren
          </p>
        </div>
        
        <button
          onClick={handleBatchGeocode}
          disabled={isGeocoding || leadsWithoutCoordinates.length === 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeocoding ? 'Geocoding läuft...' : 'Alle geocodieren'}
        </button>
      </div>

      {isGeocoding && (
        <div className="mb-4">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-gray-600 mt-2">
            Verarbeite {leadsWithoutCoordinates.length} Adressen...
          </p>
        </div>
      )}

      {showResults && geocodingResults.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Ergebnisse</h4>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-green-600">Erfolgreich</div>
            </div>
            
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failureCount}</div>
              <div className="text-sm text-red-600">Fehlgeschlagen</div>
            </div>
          </div>

          {failureCount > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-red-600">Fehlgeschlagene Geocodierungen:</h5>
              {geocodingResults
                .filter(r => !r.success)
                .map(result => (
                  <div key={result.lead_id} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Lead {result.lead_id}: {result.error}
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

## 🧪 Setup & Testing

### 1. n8n Setup
```bash
# n8n starten
docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

# Oder via npm
npm install n8n -g
n8n start
```

### 2. Supabase Connection in n8n
1. **n8n öffnen:** `http://localhost:5678`
2. **Credentials erstellen:**
   - Type: "Supabase"
   - Host: `https://your-project.supabase.co`
   - Service Role Key: `your-service-role-key`

### 3. Workflows importieren
1. **Geocoding Workflow importieren**
2. **Batch Geocoding Workflow importieren**
3. **Webhooks aktivieren**
4. **Credentials verknüpfen**

### 4. Frontend-Integration testen
```typescript
// In einer Komponente testen:
const testGeocoding = async () => {
  const result = await geocodingService.geocodeLead('test-id', 'Stephansplatz 1, 1010 Wien')
  console.log('Geocoding Result:', result)
}
```

## ✅ Definition of Done
- [ ] n8n läuft und ist konfiguriert
- [ ] Supabase Connection funktioniert
- [ ] Geocoding Workflow importiert und aktiv
- [ ] Batch Geocoding Workflow funktioniert
- [ ] Frontend Integration implementiert
- [ ] Manual Geocoding Button funktioniert
- [ ] Automatisches Geocoding bei neuen Leads
- [ ] Error Handling und Logging funktioniert

## 🔗 Nächster Step
**Step 6.2:** Follow-up Reminder System

---

## 📝 Notes & Troubleshooting

**Problem:** n8n Webhook nicht erreichbar
**Lösung:** Port 5678 freigeben, Firewall prüfen

**Problem:** OpenStreetMap API Rate Limiting
**Lösung:** 1-2 Sekunden Pause zwischen Requests

**Problem:** Supabase Connection Error
**Lösung:** Service Role Key prüfen, nicht Anon Key verwenden

**Problem:** Geocoding gibt keine Ergebnisse
**Lösung:** Adressformat prüfen, österreichische Adressen verwenden