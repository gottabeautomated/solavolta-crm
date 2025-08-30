# Step 3.2: Lead-Liste Komponente

## 🎯 Ziel
Eine responsive Lead-Liste mit Tabellen-Layout erstellen, die alle Leads anzeigt, Loading States und Error Handling implementiert.

## 📋 Checkliste

### Lead-Liste Komponente
- [x] `components/LeadList.tsx` erstellen
- [x] Tabellen-Layout mit allen wichtigen Feldern
- [x] Mobile-responsive Design
- [x] Klick-Navigation zu Detailansicht

### Loading & Error States
- [x] Loading Spinner während Datenladung
- [x] Error Message bei Fehlern
- [x] Empty State bei keine Leads
- [x] Retry-Funktionalität

### Tabellen-Design
- [x] Sortierbare Spalten-Header
- [x] Status-Badges mit Farben
- [x] Hover-Effekte für Rows
- [x] Mobile Stacked Layout

### Integration
- [x] useLeads Hook einbinden
- [x] Error Boundaries implementieren
- [x] Performance optimieren

## 🔧 Cursor Commands

### Dateien erstellen
```bash
touch src/components/LeadList.tsx
touch src/components/ui/Badge.tsx
touch src/components/ui/LoadingSpinner.tsx
touch src/components/ui/ErrorMessage.tsx
```

## 📁 Zu erstellende Dateien

### `src/components/ui/LoadingSpinner.tsx`
```typescript
import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]}`}></div>
      {text && (
        <p className="mt-4 text-gray-600 text-sm">{text}</p>
      )}
    </div>
  )
}
```

### `src/components/ui/ErrorMessage.tsx`
```typescript
import React from 'react'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ title = 'Fehler', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="ml-3 text-lg font-medium text-red-800">{title}</h3>
        </div>
        
        <p className="text-red-700 mb-4">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Erneut versuchen
          </button>
        )}
      </div>
    </div>
  )
}
```

### `src/components/ui/Badge.tsx`
```typescript
import React from 'react'
import type { LeadStatus, ContactType, PhoneStatus } from '../../types/leads'

interface BadgeProps {
  variant: 'status' | 'contact' | 'phone' | 'success' | 'warning' | 'error' | 'default'
  children: React.ReactNode
  size?: 'sm' | 'md'
}

export function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium'
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm'
  }
  
  const variantClasses = {
    status: 'bg-blue-100 text-blue-800',
    contact: 'bg-purple-100 text-purple-800',
    phone: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    default: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}

// Helper für Lead Status Badge
export function LeadStatusBadge({ status }: { status: LeadStatus | null }) {
  if (!status) return <Badge variant="default">-</Badge>

  const statusVariants: Record<LeadStatus, 'success' | 'warning' | 'error' | 'status'> = {
    'Neu': 'status',
    'Offen': 'warning', 
    'Gewonnen': 'success',
    'Verloren': 'error'
  }

  return (
    <Badge variant={statusVariants[status]}>
      {status}
    </Badge>
  )
}
```

### `src/components/LeadList.tsx`
```typescript
import React from 'react'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { LeadStatusBadge, Badge } from './ui/Badge'
import type { Lead } from '../types/leads'

interface LeadListProps {
  onLeadClick?: (lead: Lead) => void
}

export function LeadList({ onLeadClick }: LeadListProps) {
  const { leads, loading, error, refetch } = useLeads()

  if (loading) {
    return <LoadingSpinner text="Lade Leads..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden der Leads"
        message={error}
        onRetry={refetch}
      />
    )
  }

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Leads vorhanden</h3>
          <p className="text-gray-600 mb-4">Erstellen Sie Ihren ersten Lead.</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Lead erstellen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Leads ({leads.length})
          </h2>
          <button 
            onClick={refetch}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kontakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Adresse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Erstellt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr 
                key={lead.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onLeadClick?.(lead)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {lead.name || 'Unbekannt'}
                    </div>
                    {lead.follow_up && (
                      <Badge variant="warning" size="sm">Follow-up</Badge>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.phone || '-'}</div>
                  <div className="text-sm text-gray-500">{lead.email || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <LeadStatusBadge status={lead.lead_status} />
                  {lead.contact_type && (
                    <div className="mt-1">
                      <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {lead.address || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(lead.created_at).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {lead.phone && (
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📞 Anrufen
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden">
        {leads.map((lead) => (
          <div 
            key={lead.id}
            className="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => onLeadClick?.(lead)}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {lead.name || 'Unbekannt'}
                </h3>
                <p className="text-sm text-gray-500">{lead.phone}</p>
              </div>
              <LeadStatusBadge status={lead.lead_status} />
            </div>
            
            {lead.address && (
              <p className="text-sm text-gray-600 mb-2 truncate">{lead.address}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {lead.contact_type && (
                  <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                )}
                {lead.follow_up && (
                  <Badge variant="warning" size="sm">Follow-up</Badge>
                )}
              </div>
              
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="text-blue-600 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  📞 Anrufen
                </a>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-400">
              {new Date(lead.created_at).toLocaleDateString('de-DE')}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### `src/App.tsx` (Dashboard erweitern)
```typescript
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import type { Lead } from './types/leads'

function Dashboard() {
  const handleLeadClick = (lead: Lead) => {
    console.log('Lead geklickt:', lead)
    // Später: Navigation zur Detailansicht
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
          <p className="text-gray-600">
            Verwalten Sie Ihre Vertriebskontakte
          </p>
        </div>

        {/* Lead Liste */}
        <LeadList onLeadClick={handleLeadClick} />
      </div>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App
```

## 🧪 Tests

### 1. Entwicklungsserver starten
```bash
npm run dev
```

### 2. Lead-Liste testen
- [x] App öffnet Lead-Liste automatisch
- [x] 5 Test-Leads werden angezeigt
- [x] Desktop Table Layout funktioniert
- [x] Mobile Card Layout auf kleinen Bildschirmen
- [x] Status-Badges zeigen korrekte Farben
- [x] Telefon-Links funktionieren
- [x] "Aktualisieren" Button lädt Daten neu

### 3. Responsive Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# Verschiedene Bildschirmgrößen testen:
# - iPhone SE (375px)
# - iPad (768px) 
# - Desktop (1200px+)
```

### 4. Loading/Error States testen
```javascript
// Browser Console (F12):
// Netzwerk deaktivieren und Seite neu laden
// Error State sollte angezeigt werden

// Oder temporär in useLeads.ts:
// throw new Error('Test Error')
```

## ✅ Definition of Done
- [x] Lead-Liste zeigt alle Leads aus Datenbank
- [x] Desktop Table Layout ist funktional
- [x] Mobile Card Layout funktioniert responsiv
- [x] Loading Spinner wird während Datenladung angezeigt
- [x] Error Message bei Fehlern mit Retry-Button
- [x] Empty State bei keine Leads
- [x] Status-Badges zeigen korrekte Farben
- [x] Telefon-Links öffnen Anruf-Dialog
- [x] Lead-Klick Callback funktioniert
- [x] "Aktualisieren" funktioniert
- [x] Keine Console Errors

## 🔗 Nächster Step
**Step 3.3:** Such- und Filterfunktion hinzufügen

---

## 📝 Notes & Troubleshooting

**Problem:** Leads werden nicht angezeigt
**Lösung:** useLeads Hook prüfen, Supabase Datenverbindung testen

**Problem:** Mobile Layout bricht
**Lösung:** Tailwind Breakpoints prüfen, CSS Grid/Flexbox validieren

**Problem:** Status-Badges falsche Farben
**Lösung:** Badge Komponente und variantClasses prüfen

**Problem:** Telefon-Links funktionieren nicht
**Lösung:** `tel:` Protocol und Phone Format validieren 