# Step 2.1: Login-Komponente

## 🎯 Ziel
Eine Login-Form mit E-Mail/Passwort erstellen, Supabase Auth integrieren und Loading/Error States implementieren.

## 📋 Checkliste

### Login-Form erstellen
- [x] `components/Login.tsx` erstellen
- [x] Formular mit E-Mail und Passwort Feldern
- [x] Form Validierung hinzufügen
- [x] Mobile-optimierte Styles

### Supabase Auth Integration
- [x] Supabase signIn Funktion integrieren
- [x] Error Handling implementieren
- [x] Success Handling implementieren

### States & UX
- [x] Loading State während Login
- [x] Error Messages anzeigen
- [x] Form Reset nach Error
- [x] Responsive Design testen

## 🔧 Cursor Commands

### Dateien erstellen
```bash
touch src/components/Login.tsx
touch src/hooks/useAuth.ts
```

## 📁 Zu erstellende Dateien

### `src/components/Login.tsx`
```typescript
import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error state
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Login erfolgreich - wird später durch Auth Context gehandelt
        console.log('Login erfolgreich:', data.user)
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Lead Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bitte melden Sie sich an
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* E-Mail Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
                disabled={loading}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {error}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Anmeldung läuft...
                </div>
              ) : (
                'Anmelden'
              )}
            </button>
          </div>
        </form>

        {/* Development Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Entwicklungsumgebung - Jonas Login
          </p>
        </div>
      </div>
    </div>
  )
}
```

### `src/hooks/useAuth.ts` (Vorbereitung für Step 2.2)
```typescript
import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Aktuellen Auth Status prüfen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth State Changes lauschen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### `src/App.tsx` (temporär für Testing)
```typescript
import { Login } from './components/Login'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <Layout>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Willkommen, {user.email}!
        </h2>
        <p className="text-gray-600">
          Login erfolgreich! 🎉
        </p>
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Abmelden
        </button>
      </div>
    </Layout>
  )
}

export default App
```

## 🧪 Supabase Setup (WICHTIG!)

### 1. Supabase Projekt erstellen
1. **Gehe zu [supabase.com](https://supabase.com)**
2. **"Start your project" klicken**
3. **Neues Projekt erstellen:**
   - Organization wählen
   - Name: `lead-dashboard`
   - Database Passwort: Ein sicheres Passwort
   - Region: Europe (Frankfurt)

### 2. Supabase Credentials holen
1. **Projekt-Dashboard öffnen**
2. **Settings → API**
3. **Credentials kopieren:**
   ```
   Project URL: https://xyz.supabase.co
   anon/public key: eyJhbGc...
   ```

### 3. .env.local aktualisieren
```env
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein_anon_key_hier
```

### 4. Test User erstellen
1. **Supabase Dashboard → Authentication → Users**
2. **"Add user" klicken**
3. **User Daten:**
   ```
   E-Mail: jonas@beispiel.de
   Passwort: TestPasswort123!
   Auto Confirm User: ✓ aktivieren
   ```

## 🧪 Tests

### 1. Entwicklungsserver starten
```bash
npm run dev
```

### 2. Login testen
**Test 1: Falsche Credentials**
- E-Mail: `falsch@email.com`
- Passwort: `falsch`
- **Erwartung:** Error Message wird angezeigt

**Test 2: Richtige Credentials**
- E-Mail: `jonas@beispiel.de` (dein Supabase User)
- Passwort: `TestPasswort123!`
- **Erwartung:** Erfolgreicher Login, Dashboard wird angezeigt

**Test 3: Loading State**
- Während Login → Spinner sollte angezeigt werden
- Button sollte disabled sein

### 3. Mobile Design testen
```bash
# Browser Developer Tools (F12)
# Device Toolbar aktivieren
# iPhone/Android Simulation
```

## ✅ Definition of Done
- [x] Login-Form wird angezeigt
- [x] E-Mail/Passwort Validierung funktioniert
- [x] Supabase Auth Integration funktioniert
- [x] Error Messages werden angezeigt
- [x] Loading State funktioniert
- [x] Erfolgreicher Login leitet weiter
- [x] Mobile-Design ist responsive
- [x] Supabase User wurde erstellt
- [x] .env.local mit korrekten Credentials

## 🔗 Nächster Step
**Step 2.2:** Auth-Context für globales User-Management

---

## 📝 Notes & Troubleshooting

**Problem:** Supabase Auth Error "Invalid login credentials"
**Lösung:** User in Supabase Dashboard anlegen, E-Mail bestätigen

**Problem:** "Missing Supabase environment variables"
**Lösung:** `.env.local` prüfen, Cursor neustarten, Credentials validieren

**Problem:** Login funktioniert nicht
**Lösung:** Console öffnen (F12), Netzwerk-Tab prüfen, Supabase Status prüfen

**Problem:** Form wird nicht submitted
**Lösung:** `onSubmit={handleLogin}` und `type="submit"` Button prüfen

**Supabase Test Query:**
```javascript
// Browser Console (F12):
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
``` 