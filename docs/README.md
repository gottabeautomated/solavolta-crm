# 📚 Lead Dashboard - Dokumentation

Dieser Ordner enthält die schrittweise Dokumentation für die Entwicklung des Lead Dashboard Projekts.

## 📋 Übersicht

### Step 1: Projekt-Setup
- **[Step 1.1: Projekt initialisieren](./step_1_1_project_setup.md)** - Vite + React + TypeScript Setup
- **[Step 1.2: Basis-Konfiguration](./step_1_2_basic_configuration.md)** - Tailwind CSS, Supabase Client, Layout

### Step 2: Authentifizierung & Grundfunktionen
- **[Step 2.1: Login-Komponente](./step_2_1_login_component.md)** – Supabase Auth Integration
- **[Step 2.2: Auth Context & Protected Routes](./step_2_2_auth_context.md)**

### Step 3: Lead-Management
- **[Step 3.1: Datenbank-Setup](./step_3_1_database_setup.md)**
- **[Step 3.2: Lead-Liste](./step_3_2_lead_list.md)**
- **[Step 3.3: Suche & Filter](./step_3_3_search_filter.md)**

### Step 4: Lead-Ansichten & Bearbeitung
- **[Step 4.1: Lead-Detailansicht](./step_4_1_lead_detail.md)**
- **[Step 4.2: Lead-Bearbeitung](./step_4_2_lead_bearbeitung.md)**
- **[Step 4.3: Status-Management](./step_4_3_status_management.md)**

### Step 5: Karten-Integration
- **[Step 5.1: Kartenansicht (Leaflet)](./step_5_1_kartenansicht_leaflet.md)**
- **[Step 5.2: Erweiterte Karten-Features](./step_5_2_enhanced_map_features.md)**
- **[Step 5.3: Map-Refinements](./step_5_3_map_refinements.md)**

### Step 6: Automationen & Datenimport
- **[Step 6.1: n8n Geocoding-Workflow](./step_6_1_n8n_geocoding.md)**
- **[Step 6.2: Follow-up Reminder System](./step_6_2_followup_system.md)**
- Manueller Import: In der Leadliste „Leads importieren“ (CSV mit Feld‑Mapping). SQL: `src/lib/add_sap_fields.sql`.

## 🚀 Quick Start

1. **Projekt-Setup:** Folgen Sie [Step 1.1](./step_1_1_project_setup.md)
2. **Basis-Konfiguration:** Folgen Sie [Step 1.2](./step_1_2_basic_configuration.md)
3. **Entwicklungsserver starten:** `npm run dev`
4. **(Optional) CSV‑Import aktivieren:** `src/lib/add_sap_fields.sql` in Supabase ausführen

## 📁 Projektstruktur

```
lead-dashboard/
├── src/
│   ├── components/     # React Komponenten
│   ├── lib/           # Utilities & Hooks
│   ├── pages/         # Seiten-Komponenten
│   ├── types/         # TypeScript Types
│   └── App.tsx        # Haupt-App-Komponente
├── docs/              # Diese Dokumentation
├── .env.local         # Supabase Credentials
└── tailwind.config.js # Tailwind CSS Konfiguration
```

## 🔧 Technologie-Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (mobile-first)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Karten:** Leaflet.js + React-Leaflet
- **Build Tool:** Vite
- **Deployment:** Vercel/Supabase Hosting

## 📝 Notizen

- Alle Schritte sind für mobile-first Design optimiert
- Supabase wird für Backend und Authentifizierung verwendet
- TypeScript für bessere Code-Qualität und IntelliSense
- Tailwind CSS für schnelles, konsistentes Styling 