# Step 2.2: Auth-Context

## 🎯 Ziel
AuthContext für globales User-Management erstellen, Protected Routes implementieren und Logout-Funktionalität hinzufügen.

## 📋 Checkliste

### Auth Context erstellen
- [ ] `contexts/AuthContext.tsx` erstellen
- [ ] AuthProvider Komponente implementieren
- [ ] useAuthContext Hook erstellen
- [ ] User State global verwalten

### Protected Routes
- [ ] ProtectedRoute Komponente erstellen
- [ ] Route Protection implementieren
- [ ] Redirect Logic für unauthenticated Users

### Logout Funktionalität
- [ ] Logout-Funktion im Context
- [ ] Logout-Button in Layout
- [ ] Auth State Cleanup

### App Integration
- [ ] AuthProvider in App.tsx einbinden
- [ ] Login/Dashboard Logic vereinfachen
- [ ] Error Boundaries hinzufügen

## 🔧 Cursor Commands

### Ordner und Dateien erstellen
```bash
mkdir src/contexts
touch src/contexts/AuthContext.tsx
touch src/components/ProtectedRoute.tsx
```

## 📁 Zu erstellende Dateien

### `src/contexts/AuthContext.tsx`
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aktuelle Session laden
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Fehler beim Laden der Session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getSession()

    // Auth State Changes lauschen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth Event:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Fehler beim Abmelden:', error)
        throw error
      }
    } catch (error) {
      console.error('Unerwarteter Fehler beim Abmelden:', error)
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

### `src/components/ProtectedRoute.tsx`
```typescript
import React from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { Login } from './Login'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuthContext()

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Anwendung...</p>
        </div>
      </div>
    )
  }

  // Nicht eingeloggt - zeige Login
  if (!user) {
    return <Login />
  }

  // Eingeloggt - zeige geschützte Inhalte
  return <>{children}</>
}
```

### `src/components/Layout.tsx` (aktualisieren)
```typescript
import React, { useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuthContext()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
      // Error könnte hier als Toast angezeigt werden
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Lead Dashboard
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Navigation */}
              <nav className="hidden sm:flex space-x-4">
                <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Leads
                </button>
                <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                  Karte
                </button>
              </nav>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isLoggingOut ? 'Abmelden...' : 'Abmelden'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden border-t">
          <div className="px-4 py-2 space-x-4">
            <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Leads
            </button>
            <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
              Karte
            </button>
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

### `src/hooks/useAuth.ts` (vereinfachen - nutzt jetzt Context)
```typescript
import { useAuthContext } from '../contexts/AuthContext'

// Backwards compatibility - kann später entfernt werden
export function useAuth() {
  return useAuthContext()
}
```

### `src/App.tsx` (komplett überarbeiten)
```typescript
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'

function Dashboard() {
  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Lead Dashboard
        </h2>
        <p className="text-gray-600 mb-8">
          Willkommen! Das Dashboard ist bereit für die Lead-Verwaltung.
        </p>
        
        {/* Placeholder für kommende Features */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Lead-Liste</h3>
            <p className="text-gray-600">Bald verfügbar</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Kartenansicht</h3>
            <p className="text-gray-600">Bald verfügbar</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Statistiken</h3>
            <p className="text-gray-600">Bald verfügbar</p>
          </div>
        </div>
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

## 🧪 Test

### 1. Entwicklungsserver starten
```bash
npm run dev
```

### 2. Auth Flow testen
- [ ] App lädt mit Loading Spinner
- [ ] Ohne Login wird Login-Form angezeigt
- [ ] Nach erfolgreichem Login wird Dashboard angezeigt
- [ ] Abmelden-Button funktioniert
- [ ] Nach Abmelden wird wieder Login angezeigt
- [ ] Browser Refresh behält Auth State bei

### 3. Mobile Design testen
- [ ] Navigation auf Mobile ist functional
- [ ] Abmelden-Button ist erreichbar
- [ ] Layout ist responsive

### 4. Auth Context testen
```javascript
// Browser Console (F12) nach Login:
// Auth Context sollte verfügbar sein
console.log('Auth Context wird verwendet')

// Nach Logout:
// Context sollte User auf null setzen
```

## ✅ Definition of Done
- [ ] AuthContext ist global verfügbar
- [ ] ProtectedRoute schützt Dashboard
- [ ] Login/Logout Flow funktioniert vollständig
- [ ] User State wird persistent gehalten
- [ ] Mobile Navigation funktioniert
- [ ] Error Handling ist implementiert
- [ ] Loading States sind vorhanden
- [ ] Layout zeigt User E-Mail an
- [ ] Abmelden-Button funktioniert
- [ ] Browser Refresh behält Login bei

## 🔗 Nächster Step
**Step 2.3:** Auth-Testing und Supabase User Management

---

## 📝 Notes & Troubleshooting

**Problem:** Context Provider Error
**Lösung:** Prüfen ob `<AuthProvider>` um die App gewickelt ist

**Problem:** Infinite Re-renders
**Lösung:** useEffect Dependencies prüfen, besonders in AuthContext

**Problem:** Session wird nicht persistent gehalten
**Lösung:** Supabase Auth Settings prüfen, localStorage verfügbar?

**Problem:** "useAuthContext must be used within an AuthProvider"
**Lösung:** Sicherstellen dass alle Komponenten innerhalb `<AuthProvider>` sind

**Problem:** Abmelden funktioniert nicht
**Lösung:** signOut Funktion prüfen, Console auf Errors checken 