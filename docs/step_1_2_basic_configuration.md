# Step 1.2: Basis-Konfiguration

## 🎯 Ziel
Tailwind CSS, Supabase Client und TypeScript Types konfigurieren. Layout-Komponente erstellen.

## 📋 Checkliste

### Tailwind CSS Setup
- [x] Tailwind CSS initialisieren
- [x] `tailwind.config.js` für mobile-first konfigurieren
- [x] Tailwind Styles in `index.css` importieren
- [x] Bestehende CSS-Styles entfernen

### Supabase Client
- [x] `lib/supabase.ts` erstellen
- [x] Supabase Client konfigurieren
- [x] Environment Variables einbinden

### TypeScript Types
- [x] `types/leads.ts` erstellen
- [x] Lead Interface definieren
- [x] Database Types definieren

### Layout-Komponente
- [x] `components/Layout.tsx` erstellen
- [x] Navigation erstellen
- [x] Mobile-optimiertes Layout

## 🔧 Cursor Commands

### 1. Tailwind CSS initialisieren
```bash
npx tailwindcss init -p
```

### 2. Dateien erstellen
```bash
# In Cursor Terminal
touch src/lib/supabase.ts
touch src/types/leads.ts
touch src/components/Layout.tsx
```

## 📁 Zu erstellende/bearbeitende Dateien

### `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
    screens: {
      'sm': '640px',
      'md': '768px', 
      'lg': '1024px',
      'xl': '1280px',
    }
  },
  plugins: [],
}
```

### `src/index.css` (ersetzen)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}
```

### `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### `src/types/leads.ts`
```typescript
export interface Lead {
  id: string
  created_at: string
  name: string | null
  phone: string | null
  email: string | null
  address: string | null
  status_since: string | null
  lead_status: string | null
  contact_type: string | null
  phone_status: string | null
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

export type LeadStatus = 'Neu' | 'Offen' | 'Verloren' | 'Gewonnen'
export type ContactType = 'Telefon' | 'Vor Ort' | 'E-Mail'
export type PhoneStatus = 'erreicht' | 'keine Antwort' | 'besetzt' | 'nicht verfügbar'
```

### `src/components/Layout.tsx`
```typescript
import React from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Lead Dashboard
            </h1>
            
            {/* Navigation wird später hier eingefügt */}
            <nav className="flex space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                Leads
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                Karte
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}
```

### `src/App.tsx` (aktualisieren)
```typescript
import { Layout } from './components/Layout'

function App() {
  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Lead Dashboard
        </h2>
        <p className="text-gray-600">
          Projekt erfolgreich konfiguriert! 🚀
        </p>
      </div>
    </Layout>
  )
}

export default App
```

## 🧪 Test
```bash
# Entwicklungsserver starten
npm run dev
```

Du solltest jetzt eine saubere, mobile-optimierte Seite sehen mit Header und Navigation.

## ✅ Definition of Done
- [x] Tailwind CSS funktioniert (Styles werden angezeigt)
- [x] Supabase Client ist konfiguriert (keine Console Errors)
- [x] TypeScript Types sind definiert
- [x] Layout-Komponente wird angezeigt
- [x] Mobile-responsive Design funktioniert

## 🔗 Nächster Step
**Step 2.1:** Login-Komponente erstellen

---

## 📝 Notes & Troubleshooting

**Problem:** Tailwind Styles werden nicht angezeigt
**Lösung:** Prüfen ob `@tailwind` Imports in `index.css` stehen

**Problem:** Supabase Environment Variables Fehler
**Lösung:** `.env.local` prüfen, Cursor/VS Code neustarten 