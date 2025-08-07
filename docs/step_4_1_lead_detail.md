# Step 4.1: Lead-Detailansicht (Read-Only)

## 🎯 Ziel
Eine Lead-Detailansicht erstellen, die alle Lead-Informationen übersichtlich anzeigt, Navigation zwischen Liste und Detail ermöglicht und mobile-optimiert ist.

## 📋 Checkliste

### Lead-Detail Komponente
- [x] `components/LeadDetail.tsx` erstellen
- [x] Alle Lead-Felder übersichtlich anzeigen
- [x] Strukturierte Darstellung (Kontakt, Status, Termine, etc.)
- [x] Mobile-responsive Layout

### Navigation & Routing
- [x] State-Management für aktuelle Ansicht
- [x] Back-Button zur Lead-Liste
- [x] Lead-Klick Navigation implementieren
- [x] URL-State optional (für später)

### UI/UX Design
- [x] Professionelles Card-Layout
- [x] Status-Badges und Icons
- [x] Telefon/E-Mail Links funktional
- [x] Loading State für Lead-Details

### Daten-Integration
- [x] fetchLead Hook Integration
- [x] Error Handling für nicht gefundene Leads
- [x] Loading States während Datenabruf

## 🔧 Cursor Commands

### Dateien erstellen
```bash
touch src/components/LeadDetail.tsx
touch src/components/ui/Card.tsx
touch src/components/ui/IconButton.tsx
```

## 📁 Zu erstellende Dateien

### `src/components/ui/Card.tsx`
```typescript
import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
    </div>
  )
}

interface CardSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function CardSection({ title, children, className = '' }: CardSectionProps) {
  return (
    <div className={`mb-6 last:mb-0 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        {title}
      </h4>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}
```

### `src/components/ui/IconButton.tsx`
```typescript
import React from 'react'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  children?: React.ReactNode
  className?: string
}

export function IconButton({
  icon,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  children,
  className = ''
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm gap-1',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2 text-base gap-2'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  )
}
```

### `src/components/LeadDetail.tsx`
```typescript
import React, { useState, useEffect } from 'react'
import { useLeads } from '../hooks/useLeads'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { ErrorMessage } from './ui/ErrorMessage'
import { Card, CardSection } from './ui/Card'
import { IconButton } from './ui/IconButton'
import { LeadStatusBadge, Badge } from './ui/Badge'
import type { Lead } from '../types/leads'

interface LeadDetailProps {
  leadId: string
  onBack: () => void
}

export function LeadDetail({ leadId, onBack }: LeadDetailProps) {
  const { fetchLead } = useLeads()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLead = async () => {
      setLoading(true)
      setError(null)
      
      const { data, error } = await fetchLead(leadId)
      
      if (error) {
        setError(error.message)
      } else {
        setLead(data)
      }
      
      setLoading(false)
    }

    loadLead()
  }, [leadId, fetchLead])

  if (loading) {
    return <LoadingSpinner text="Lade Lead-Details..." />
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Fehler beim Laden des Leads"
        message={error}
        onRetry={() => window.location.reload()}
      />
    )
  }

  if (!lead) {
    return (
      <ErrorMessage 
        title="Lead nicht gefunden"
        message="Das angeforderte Lead konnte nicht gefunden werden."
        onRetry={onBack}
      />
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('de-DE')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE')
  }

  return (
    <div className="space-y-6">
      {/* Header mit Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <IconButton
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            }
            onClick={onBack}
            variant="ghost"
          >
            Zurück
          </IconButton>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {lead.name || 'Unbekannter Lead'}
            </h1>
            <p className="text-gray-600">
              Lead-Details
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {lead.follow_up && (
            <Badge variant="warning">Follow-up erforderlich</Badge>
          )}
          <LeadStatusBadge status={lead.lead_status} />
        </div>
      </div>

      {/* Lead-Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Kontaktinformationen */}
        <Card title="Kontaktinformationen">
          <CardSection title="Persönliche Daten">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm text-gray-900">{lead.name || '-'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">E-Mail</label>
                {lead.email ? (
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <p className="text-sm text-gray-900">-</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Telefon</label>
                {lead.phone ? (
                  <div className="flex items-center space-x-2">
                    <a 
                      href={`tel:${lead.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {lead.phone}
                    </a>
                    <IconButton
                      icon={
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                      onClick={() => window.open(`tel:${lead.phone}`)}
                      variant="ghost"
                      size="sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">-</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Adresse</label>
                <p className="text-sm text-gray-900">{lead.address || '-'}</p>
              </div>
            </div>
          </CardSection>
        </Card>

        {/* Status & Termine */}
        <Card title="Status & Termine">
          <CardSection title="Lead-Status">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Aktueller Status</label>
                <div className="mt-1">
                  <LeadStatusBadge status={lead.lead_status} />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Status seit</label>
                <p className="text-sm text-gray-900">{formatDate(lead.status_since)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Kontakttyp</label>
                {lead.contact_type ? (
                  <Badge variant="contact" size="sm">{lead.contact_type}</Badge>
                ) : (
                  <p className="text-sm text-gray-900">-</p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Telefonstatus</label>
                <p className="text-sm text-gray-900">{lead.phone_status || '-'}</p>
              </div>
            </div>
          </CardSection>

          {(lead.appointment_date || lead.appointment_time) && (
            <CardSection title="Termine">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Termindatum</label>
                  <p className="text-sm text-gray-900">{formatDate(lead.appointment_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Terminzeit</label>
                  <p className="text-sm text-gray-900">{lead.appointment_time || '-'}</p>
                </div>
              </div>
            </CardSection>
          )}
        </Card>

        {/* Angebote & Leistungen */}
        <Card title="Angebote & Leistungen">
          <CardSection title="Angebotsstatus">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">PV-Angebot</label>
                <Badge variant={lead.offer_pv ? 'success' : 'default'} size="sm">
                  {lead.offer_pv ? 'Erstellt' : 'Nicht erstellt'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">Speicher-Angebot</label>
                <Badge variant={lead.offer_storage ? 'success' : 'default'} size="sm">
                  {lead.offer_storage ? 'Erstellt' : 'Nicht erstellt'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">Notstrom-Angebot</label>
                <Badge variant={lead.offer_backup ? 'success' : 'default'} size="sm">
                  {lead.offer_backup ? 'Erstellt' : 'Nicht erstellt'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">TVP</label>
                <Badge variant={lead.tvp ? 'success' : 'default'} size="sm">
                  {lead.tvp ? 'Erstellt' : 'Nicht erstellt'}
                </Badge>
              </div>
            </div>
          </CardSection>
        </Card>

        {/* Follow-up & Export */}
        <Card title="Follow-up & Export">
          <CardSection title="Nachbearbeitung">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">Follow-up erforderlich</label>
                <Badge variant={lead.follow_up ? 'warning' : 'default'} size="sm">
                  {lead.follow_up ? 'Ja' : 'Nein'}
                </Badge>
              </div>
              
              {lead.follow_up_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Follow-up Datum</label>
                  <p className="text-sm text-gray-900">{formatDate(lead.follow_up_date)}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-500">SAP-Export</label>
                <Badge variant={lead.exported_to_sap ? 'success' : 'default'} size="sm">
                  {lead.exported_to_sap ? 'Exportiert' : 'Nicht exportiert'}
                </Badge>
              </div>
            </div>
          </CardSection>
        </Card>
      </div>

      {/* Dokumentation */}
      {lead.documentation && (
        <Card title="Dokumentation">
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{lead.documentation}</p>
          </div>
        </Card>
      )}

      {/* Links */}
      {(lead.doc_link || lead.calendar_link) && (
        <Card title="Links & Dokumente">
          <div className="grid grid-cols-1 gap-3">
            {lead.doc_link && (
              <div>
                <label className="text-sm font-medium text-gray-500">Dokumenten-Link</label>
                <a 
                  href={lead.doc_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 break-all"
                >
                  {lead.doc_link}
                </a>
              </div>
            )}
            
            {lead.calendar_link && (
              <div>
                <label className="text-sm font-medium text-gray-500">Kalender-Link</label>
                <a 
                  href={lead.calendar_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 break-all"
                >
                  {lead.calendar_link}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Meta-Informationen */}
      <Card title="Meta-Informationen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-500">Erstellt am</label>
            <p className="text-sm text-gray-900">{formatDateTime(lead.created_at)}</p>
          </div>
          
          {lead.updated_at && (
            <div>
              <label className="text-sm font-medium text-gray-500">Letzte Änderung</label>
              <p className="text-sm text-gray-900">{formatDateTime(lead.updated_at)}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-500">Lead-ID</label>
            <p className="text-sm font-mono text-gray-900">{lead.id}</p>
          </div>
          
          {(lead.lat && lead.lng) && (
            <div>
              <label className="text-sm font-medium text-gray-500">Koordinaten</label>
              <p className="text-sm font-mono text-gray-900">
                {lead.lat.toFixed(6)}, {lead.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
```

### `src/App.tsx` (erweitern für Navigation)
```typescript
import React, { useState } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LeadList } from './components/LeadList'
import { LeadDetail } from './components/LeadDetail'
import type { Lead } from './types/leads'

type View = 'list' | 'detail'

function Dashboard() {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setCurrentView('list')
    setSelectedLeadId(null)
  }

  return (
    <Layout>
      <div className="space-y-6">
        {currentView === 'list' && (
          <>
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lead Dashboard</h1>
              <p className="text-gray-600">
                Verwalten Sie Ihre Vertriebskontakte
              </p>
            </div>

            {/* Lead Liste */}
            <LeadList onLeadClick={handleLeadClick} />
          </>
        )}

        {currentView === 'detail' && selectedLeadId && (
          <LeadDetail 
            leadId={selectedLeadId}
            onBack={handleBackToList}
          />
        )}
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

### 2. Navigation testen
- [x] **Lead-Liste anzeigen**: App startet mit Lead-Liste
- [x] **Lead anklicken**: Klick auf Lead öffnet Detailansicht
- [x] **Zurück-Button**: "Zurück" Button führt zur Liste zurück
- [x] **Lead-Details laden**: Details werden korrekt angezeigt

### 3. Detailansicht testen
- [x] **Alle Felder anzeigen**: Alle Lead-Informationen werden angezeigt
- [x] **Status-Badges**: Status wird mit korrekten Farben angezeigt
- [x] **Telefon-Links**: Telefon-Links öffnen Anruf-Dialog
- [x] **E-Mail-Links**: E-Mail-Links öffnen Mail-Client
- [x] **Externe Links**: doc_link und calendar_link öffnen neue Tabs

### 4. Responsive Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# Mobile/Tablet/Desktop Ansichten testen
```

### 5. Error Handling testen
```javascript
# Browser Console (F12):
# Test mit nicht existierender Lead-ID
# Sollte "Lead nicht gefunden" Error zeigen
```

## ✅ Definition of Done
- [x] Lead-Detailansicht zeigt alle Lead-Informationen
- [x] Navigation zwischen Liste und Detail funktioniert
- [x] Zurück-Button führt zur Lead-Liste
- [x] Status-Badges werden korrekt angezeigt
- [x] Telefon- und E-Mail-Links funktionieren
- [x] Mobile-responsive Design
- [x] Loading States während Datenladung
- [x] Error Handling für nicht gefundene Leads
- [x] Strukturierte, übersichtliche Darstellung
- [x] Externe Links öffnen in neuen Tabs

## 🔗 Nächster Step
**Step 4.2:** Lead-Bearbeitung (Edit-Mode)

---

## 📝 Notes & Troubleshooting

**Problem:** Lead-Details werden nicht geladen
**Lösung:** fetchLead Hook prüfen, Lead-ID validieren

**Problem:** Navigation funktioniert nicht
**Lösung:** State-Management in App.tsx prüfen, onClick Handler validieren

**Problem:** Mobile Layout bricht
**Lösung:** Tailwind Grid-Klassen und Responsive Breakpoints prüfen

**Problem:** Links funktionieren nicht
**Lösung:** URL-Format validieren, rel="noopener noreferrer" für externe Links

**Problem:** Status-Badges falsche Farben
**Lösung:** LeadStatusBadge Komponente und Variant-Mapping prüfen 