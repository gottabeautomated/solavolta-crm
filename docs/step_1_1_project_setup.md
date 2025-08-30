# Step 1.1: Cursor Projekt initialisieren

## 🎯 Ziel
Ein neues React + TypeScript Projekt mit Vite aufsetzen und alle notwendigen Dependencies installieren.

## 📋 Checkliste

### Projekt erstellen
- [x] Neues Vite-Projekt mit React + TypeScript Template erstellen
- [x] In das Projektverzeichnis wechseln
- [x] Git Repository initialisieren
- [x] Erste Dependencies installieren

### Ordnerstruktur anlegen
- [x] `/src/components` - React Komponenten
- [x] `/src/lib` - Utilities & Hooks
- [x] `/src/pages` - Seiten-Komponenten
- [x] `/src/types` - TypeScript Type Definitionen

### Environment Setup
- [x] `.env.local` Datei erstellen
- [x] `.env.example` Template erstellen
- [x] `.gitignore` um `.env.local` erweitern

## 🔧 Cursor Commands

### 1. Projekt erstellen
```bash
# Terminal in Cursor öffnen
npm create vite@latest lead-dashboard -- --template react-ts
cd lead-dashboard
```

### 2. Dependencies installieren
```bash
# Basis Dependencies
npm install

# Supabase
npm install @supabase/supabase-js

# Leaflet für Karten
npm install react-leaflet leaflet

# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# TypeScript Types für Leaflet
npm install -D @types/leaflet
```

### 3. Git initialisieren
```bash
git init
git add .
git commit -m "Initial commit: Vite React TypeScript setup"
```

### 4. Ordnerstruktur erstellen
```bash
# In src/ Verzeichnis
mkdir src/components src/lib src/pages src/types
```

### 5. Environment Files erstellen
```bash
# .env.local erstellen
touch .env.local

# .env.example erstellen  
touch .env.example
```

## 📁 Zu erstellende Dateien

### `.env.local`
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### `.env.example`
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### `.gitignore` (erweitern)
```gitignore
# Existing content...

# Environment variables
.env.local
.env.production.local
```

## 🧪 Test
```bash
# Entwicklungsserver starten
npm run dev
```

Browser sollte sich öffnen mit der Standard Vite + React Seite.

## ✅ Definition of Done
- [x] Projekt läuft unter `http://localhost:5173`
- [x] Alle Dependencies sind installiert
- [x] Ordnerstruktur ist angelegt
- [x] Git Repository ist initialisiert
- [x] Environment Files sind erstellt

## 🔗 Nächster Step
**Step 1.2:** Basis-Konfiguration (Tailwind, Supabase Client, Types)

---

## 📝 Notes & Troubleshooting

**Problem:** `npm create vite` funktioniert nicht
**Lösung:** Node.js Version prüfen (min. v16), ggf. `npx create-vite` verwenden

**Problem:** TypeScript Errors
**Lösung:** Warten bis alle Dependencies installiert sind, dann VS Code/Cursor neustarten 