# Step 3.1: Datenbank & Types

## 🎯 Ziel
Supabase Datenbank mit Lead-Schema einrichten, TypeScript Interfaces erweitern und useLeads Hook für CRUD-Operationen implementieren.

## 📋 Checkliste

### Supabase Datenbank Setup
- [ ] `schema.sql` in Supabase SQL Editor ausführen
- [ ] Tabelle `leads` erstellen und verifizieren
- [ ] Test-Daten einfügen
- [ ] Row Level Security (RLS) konfigurieren

### TypeScript Types erweitern
- [ ] `types/leads.ts` erweitern
- [ ] Database Response Types hinzufügen
- [ ] Enum Types für Dropdown-Werte

### useLeads Hook erweitern
- [ ] CRUD Operationen implementieren
- [ ] Error Handling hinzufügen
- [ ] Loading States für alle Operationen
- [ ] Optimistic Updates

### Testing
- [ ] Datenbank-Verbindung testen
- [ ] CRUD Operationen testen
- [ ] Error Scenarios testen

## 🔧 Cursor Commands

### Dateien erstellen/aktualisieren
```bash
touch src/lib/database.sql
touch src/hooks/useLeads.ts
```

## 📁 Zu erstellende/bearbeitende Dateien

### `src/lib/database.sql`
```sql
-- Lead-Tabelle erstellen
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text,
  phone text,
  email text,
  address text,
  status_since date DEFAULT CURRENT_DATE,
  lead_status text DEFAULT 'Neu',
  contact_type text,
  phone_status text,
  appointment_date date,
  appointment_time text,
  offer_pv boolean DEFAULT false,
  offer_storage boolean DEFAULT false,
  offer_backup boolean DEFAULT false,
  tvp boolean DEFAULT false,
  documentation text,
  doc_link text,
  calendar_link text,
  follow_up boolean DEFAULT false,
  follow_up_date date,
  exported_to_sap boolean DEFAULT false,
  lat double precision,
  lng double precision
);

-- Updated_at Trigger erstellen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_coordinates ON leads(lat, lng);

-- Test-Daten einfügen
INSERT INTO leads (name, phone, email, address, lead_status, contact_type, lat, lng) VALUES
  ('Max Mustermann', '+43 664 123 4567', 'max@beispiel.com', 'Hauptstraße 1, 1010 Wien', 'Neu', 'Telefon', 48.2082, 16.3738),
  ('Anna Schmidt', '+43 664 987 6543', 'anna@test.at', 'Salzburger Straße 15, 5020 Salzburg', 'Offen', 'Vor Ort', 47.8095, 13.0550),
  ('Peter Huber', '+43 664 555 1234', 'peter@firma.at', 'Linzer Gasse 10, 4020 Linz', 'Verloren', 'Telefon', 48.3059, 14.2862),
  ('Maria Bauer', '+43 664 777 8899', 'maria@email.com', 'Grazer Straße 5, 8010 Graz', 'Gewonnen', 'E-Mail', 47.0707, 15.4395),
  ('Thomas Weber', '+43 664 111 2233', 'thomas@web.at', 'Innsbrucker Platz 3, 6020 Innsbruck', 'Offen', 'Vor Ort', 47.2692, 11.4041);

-- Row Level Security aktivieren
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy für authentifizierte User (alle Operationen erlauben)
CREATE POLICY "Leads sind für alle authentifizierten User sichtbar" ON leads
  FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Policy für anonyme User (nur lesen)
-- CREATE POLICY "Leads sind für anonyme User lesbar" ON leads
--   FOR SELECT USING (true);
```

### `src/types/leads.ts` (erweitern)
```typescript
export interface Lead {
  id: string
  created_at: string
  updated_at?: string
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  status_since: string | null
  lead_status: LeadStatus | null
  contact_type: ContactType | null
  phone_status: PhoneStatus | null
  appointment_date: string | null
  appointment_time: string | null
  offer_pv: boolean | null
  offer_storage: boolean | null
  offer_backup: boolean | null
  tvp: boolean | null
  documentation: string | null
  doc_link: string | null
  calendar_link: string | null
  follow_up: boolean | null
  follow_up_date: string | null
  exported_to_sap: boolean | null
  lat: number | null
  lng: number | null
}

// Enums für bessere Type Safety
export type LeadStatus = 'Neu' | 'Offen' | 'Verloren' | 'Gewonnen'
export type ContactType = 'Telefon' | 'Vor Ort' | 'E-Mail'
export type PhoneStatus = 'erreicht' | 'keine Antwort' | 'besetzt' | 'nicht verfügbar'

// Für Dropdown-Listen
export const LEAD_STATUS_OPTIONS: LeadStatus[] = ['Neu', 'Offen', 'Verloren', 'Gewonnen']
export const CONTACT_TYPE_OPTIONS: ContactType[] = ['Telefon', 'Vor Ort', 'E-Mail']
export const PHONE_STATUS_OPTIONS: PhoneStatus[] = ['erreicht', 'keine Antwort', 'besetzt', 'nicht verfügbar']

// Für neue Leads (ohne ID und Timestamps)
export type CreateLeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at'>

// Für Updates (alle Felder optional außer ID)
export type UpdateLeadInput = Partial<Omit<Lead, 'id' | 'created_at'>> & { id: string }

// Supabase Response Types
export interface DatabaseResponse<T> {
  data: T | null
  error: Error | null
}

export interface DatabaseListResponse<T> {
  data: T[] | null
  error: Error | null
  count?: number
}

// Filter Types für Lead-Liste
export interface LeadFilters {
  search?: string
  status?: LeadStatus
  follow_up?: boolean
  exported_to_sap?: boolean
  contact_type?: ContactType
  phone_status?: PhoneStatus
}

// Sort Options
export type LeadSortField = 'created_at' | 'name' | 'lead_status' | 'follow_up_date'
export type SortDirection = 'asc' | 'desc'

export interface LeadSortOptions {
  field: LeadSortField
  direction: SortDirection
}
```

### `src/hooks/useLeads.ts` (komplett überarbeiten)
```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { 
  Lead, 
  CreateLeadInput, 
  UpdateLeadInput, 
  LeadFilters, 
  LeadSortOptions,
  DatabaseResponse,
  DatabaseListResponse 
} from '../types/leads'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Lead-Liste laden
  const fetchLeads = useCallback(async (
    filters?: LeadFilters,
    sort?: LeadSortOptions
  ) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from('leads').select('*')

      // Filter anwenden
      if (filters) {
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }
        if (filters.status) {
          query = query.eq('lead_status', filters.status)
        }
        if (filters.follow_up !== undefined) {
          query = query.eq('follow_up', filters.follow_up)
        }
        if (filters.exported_to_sap !== undefined) {
          query = query.eq('exported_to_sap', filters.exported_to_sap)
        }
        if (filters.contact_type) {
          query = query.eq('contact_type', filters.contact_type)
        }
        if (filters.phone_status) {
          query = query.eq('phone_status', filters.phone_status)
        }
      }

      // Sortierung anwenden
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' })
      } else {
        // Standard-Sortierung: Neueste zuerst
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setLeads(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Leads'
      setError(errorMessage)
      console.error('Fehler beim Laden der Leads:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Einzelnen Lead laden
  const fetchLead = useCallback(async (id: string): Promise<DatabaseResponse<Lead>> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      return { data, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Unbekannter Fehler') 
      }
    }
  }, [])

  // Neuen Lead erstellen
  const createLead = useCallback(async (leadData: CreateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single()

      if (!error && data) {
        // Optimistic Update: Lead zur lokalen Liste hinzufügen
        setLeads(prevLeads => [data, ...prevLeads])
      }

      return { data, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Erstellen des Leads') 
      }
    }
  }, [])

  // Lead aktualisieren
  const updateLead = useCallback(async (leadData: UpdateLeadInput): Promise<DatabaseResponse<Lead>> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(leadData)
        .eq('id', leadData.id)
        .select()
        .single()

      if (!error && data) {
        // Optimistic Update: Lead in lokaler Liste aktualisieren
        setLeads(prevLeads => 
          prevLeads.map(lead => 
            lead.id === data.id ? data : lead
          )
        )
      }

      return { data, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Aktualisieren des Leads') 
      }
    }
  }, [])

  // Lead löschen
  const deleteLead = useCallback(async (id: string): Promise<DatabaseResponse<void>> => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (!error) {
        // Optimistic Update: Lead aus lokaler Liste entfernen
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id))
      }

      return { data: null, error }
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err : new Error('Fehler beim Löschen des Leads') 
      }
    }
  }, [])

  // Initiales Laden beim Mount
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  return {
    // State
    leads,
    loading,
    error,
    
    // Actions
    fetchLeads,
    fetchLead,
    createLead,
    updateLead,
    deleteLead,
    
    // Helper
    refetch: fetchLeads
  }
}
```

## 🧪 Supabase Setup

### 1. Schema in Supabase ausführen
1. **Supabase Dashboard öffnen**
   - Gehe zu deinem Projekt
   - SQL Editor → "New query"

2. **SQL Script ausführen**
   - Kopiere komplettes `database.sql` Script
   - "Run" klicken
   - Erfolg verifizieren

3. **Tabelle verifizieren**
   - Table Editor → "leads" Tabelle sollte sichtbar sein
   - 5 Test-Datensätze sollten vorhanden sein

### 2. RLS (Row Level Security) testen
```sql
-- Test Query in Supabase SQL Editor
SELECT * FROM leads;
-- Sollte alle Test-Leads zurückgeben
```

## 🧪 Tests

### 1. Hook Testing
```bash
npm run dev
```

### 2. Browser Console Tests
```javascript
// In Browser Console (F12):

// 1. Leads laden testen
const { data, error } = await supabase.from('leads').select('*')
console.log('Leads:', data)

// 2. Neuen Lead erstellen testen
const newLead = {
  name: 'Test Lead',
  phone: '+43 664 999 0000',
  email: 'test@test.com',
  address: 'Test Straße 1, 1010 Wien',
  lead_status: 'Neu'
}

const { data: created, error: createError } = await supabase
  .from('leads')
  .insert([newLead])
  .select()

console.log('Created:', created, createError)
```

### 3. App.tsx für Testing aktualisieren
```typescript
// Temporär in Dashboard() Funktion hinzufügen:
import { useLeads } from '../hooks/useLeads'

function Dashboard() {
  const { leads, loading, error } = useLeads()

  if (loading) return <div>Lade Leads...</div>
  if (error) return <div>Fehler: {error}</div>

  return (
    <Layout>
      <div>
        <h2>Leads ({leads.length})</h2>
        <ul>
          {leads.map(lead => (
            <li key={lead.id}>{lead.name} - {lead.lead_status}</li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
```

## ✅ Definition of Done
- [ ] Supabase Tabelle `leads` existiert und funktioniert
- [ ] Test-Daten sind eingefügt (5 Leads)
- [ ] Row Level Security ist aktiviert
- [ ] TypeScript Types sind vollständig definiert
- [ ] useLeads Hook implementiert alle CRUD-Operationen
- [ ] Error Handling funktioniert
- [ ] Loading States sind implementiert
- [ ] Browser Console zeigt keine Errors
- [ ] Test-Queries in Supabase funktionieren
- [ ] App zeigt Lead-Liste an (temporärer Test)

## 🔗 Nächster Step
**Step 3.2:** Lead-Liste Komponente erstellen

---

## 📝 Notes & Troubleshooting

**Problem:** SQL Script Fehler in Supabase
**Lösung:** Zeile für Zeile ausführen, Syntax prüfen

**Problem:** RLS verhindert Datenzugriff
**Lösung:** Policy prüfen, User Authentication verifizieren

**Problem:** TypeScript Errors bei Lead Types
**Lösung:** `types/leads.ts` importieren, Interface-Definitionen prüfen

**Problem:** useLeads Hook lädt keine Daten
**Lösung:** Network Tab in Browser prüfen, Supabase Credentials validieren

**Problem:** "auth.role() = 'authenticated'" Policy funktioniert nicht
**Lösung:** User muss eingeloggt sein, Session prüfen in Supabase Dashboard 