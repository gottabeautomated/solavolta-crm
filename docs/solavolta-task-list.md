# 📋 SolaVolta Enhancement - Konkrete Aufgabenliste

*Basierend auf bestehendem MVP mit Multi-Tenant-System*

---

## 🎯 PHASE 0: Vorbereitung & Setup

### **✅ Abgeschlossen:**
- [x] Anforderungs-Analyse
- [x] Bestehende Features dokumentiert
- [x] Enhancement-PRD erstellt

### **⏳ Nächste Schritte:**

#### **P0.1: Multi-Tenant Production Setup (2 Stunden)**
- [ ] Multi-Tenant System von localhost auf production deployen
- [ ] Vercel Environment Variables konfigurieren
- [ ] Supabase RLS-Policies testen
- [ ] Default Tenant für bestehende Daten erstellen

#### **P0.2: Development Environment vorbereiten (1 Stunde)**
- [ ] Repository auf aktuellsten Stand bringen
- [ ] Feature-Branch für Sprint 1 erstellen: `feature/daily-operations-dashboard`
- [ ] TypeScript-Types für neue Features vorbereiten
- [ ] Test-Daten in Supabase anlegen

---

## 🚀 SPRINT 1: Daily Operations Dashboard (3-4 Tage)

### **Ziel:** Bestehende Lead-Liste zu strukturiertem Daily Dashboard erweitern

#### **S1.1: Datenbank-Erweiterungen (2-3 Stunden)**
- [ ] `enhanced_follow_ups` Tabelle erstellen
- [ ] RLS-Policies für neue Tabelle
- [ ] Migration Script für bestehende Follow-ups
- [ ] TypeScript-Types für Enhanced Follow-ups

```sql
-- Zu implementieren:
CREATE TABLE enhanced_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  type ENUM('call', 'offer_followup', 'meeting', 'custom'),
  due_date DATE,
  priority ENUM('low', 'medium', 'high', 'overdue'),
  auto_generated BOOLEAN DEFAULT false,
  escalation_level INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

#### **S1.2: Dashboard-API & Hooks (3-4 Stunden)**
- [ ] `useDashboardData()` Hook erstellen
- [ ] Dashboard-Queries für Heute/Überfällig/Diese Woche
- [ ] Priorisierungs-Algorithmus implementieren
- [ ] Performance-Optimierung mit React Query

```typescript
// Hooks zu implementieren:
const useDashboardData = () => {
  // Heute fällige Aktionen
  // Überfällige Follow-ups
  // Diese Woche geplante Termine
  // Priorisierte Lead-Liste
}
```

#### **S1.3: Dashboard-UI Components (4-5 Stunden)**
- [ ] `DashboardOverview` Component
- [ ] `OverdueCard` Component für überfällige Aktionen
- [ ] `TodayCard` Component für heutige Termine
- [ ] `WeekCard` Component für Wochenübersicht
- [ ] Quick-Actions in Lead-Cards

```
/src/components/dashboard/
├── DashboardOverview.tsx
├── OverdueCard.tsx
├── TodayCard.tsx
├── WeekCard.tsx
└── QuickActions.tsx
```

#### **S1.4: Dashboard-Page & Routing (2-3 Stunden)**
- [ ] `/dashboard` Route erstellen
- [ ] Navigation erweitern
- [ ] Mobile-optimiertes Layout
- [ ] Loading-States und Error-Handling

#### **S1.5: Testing & Polish (2-3 Stunden)**
- [ ] Dashboard mit Test-Daten testen
- [ ] Mobile-Responsiveness prüfen
- [ ] Performance-Tests
- [ ] Bug-Fixes und UI-Polish

---

## 🔄 SPRINT 2: Smart Follow-up Automation (2-3 Tage)

### **Ziel:** Bestehendes Follow-up System um Automation erweitern

#### **S2.1: Status-basierte Timer-Logik (3-4 Stunden)**
- [ ] Timer-Regeln definieren (Status → Follow-up-Intervall)
- [ ] Automatische Follow-up-Erstellung bei Status-Change
- [ ] Eskalations-Logik (2 Tage → 5 Tage → 10 Tage)
- [ ] Timer-Override für manuelle Anpassungen

#### **S2.2: n8n Automation-Workflows (3-4 Stunden)**
- [ ] n8n Workflow: Status-Change-Trigger
- [ ] n8n Workflow: Tägliche Timer-Checks
- [ ] n8n Workflow: Eskalations-E-Mails
- [ ] Webhook-Integration ins Lead-System

#### **S2.3: Enhanced Follow-up UI (2-3 Stunden)**
- [ ] Erweiterte Follow-up-Komponente
- [ ] Timer-Management-Interface
- [ ] Eskalations-Status-Anzeige
- [ ] Bulk-Actions für Follow-ups

#### **S2.4: Integration & Testing (2-3 Stunden)**
- [ ] Follow-up-Workflows testen
- [ ] E-Mail-Benachrichtigungen prüfen
- [ ] Timer-Logik validieren
- [ ] Performance-Tests

---

## 📊 SPRINT 3: SolaVolta Angebots-Tools (4-5 Tage)

### **Ziel:** Vollständige Angebots-Checkliste & Kalkulator

#### **S3.1: Komponenten-Datenbank (1 Tag)**
- [ ] `components` Tabelle erstellen
- [ ] Standard-Komponenten importieren (Trina TSM-455, SolaX, etc.)
- [ ] Komponenten-Management UI
- [ ] Preis-Update-Funktionalität

#### **S3.2: Kalkulationslogik (1,5 Tage)**
- [ ] Excel-Formeln in TypeScript umsetzen
- [ ] Kalkulationsklasse implementieren
- [ ] PLZ-basierte Aufschläge
- [ ] Dachtyp-spezifische Berechnungen

```typescript
// Kalkulationslogik zu implementieren:
class SolaVoltaCalculator {
  calculateModules(kWp: number): number
  calculateFixedDiscount(kWp: number): number
  calculateMountingCost(modules: number, roofType: string): number
  calculatePLZSurcharge(plz: string): number
  generateSAPPositions(): SAPPosition[]
}
```

#### **S3.3: Angebots-Checkliste UI (1,5 Tage)**
- [ ] `OfferCalculator` Component
- [ ] Schritt-für-Schritt-Wizard
- [ ] Auto-Berechnungsfelder
- [ ] Fortschritts-Anzeige
- [ ] SAP-Position-Export

#### **S3.4: Integration ins Lead-System (1 Tag)**
- [ ] Kalkulation in Lead-Detail einbinden
- [ ] Kalkulations-Persistierung
- [ ] Status-Integration (Angebot erstellt)
- [ ] Angebots-History

---

## ✅ SPRINT 4: TVP-Checkliste System (2-3 Tage)

### **Ziel:** Technisches Vertriebs-Protokoll vor Gewonnen-Status

#### **S4.1: TVP-Datenbank & Logic (1 Tag)**
- [ ] `tvp_checklists` Tabelle
- [ ] TVP-Validierung vor Status "Gewonnen"
- [ ] Checklisten-Persistierung
- [ ] Status-Gate-Logic

#### **S4.2: TVP-Checkliste UI (1 Tag)**
- [ ] `TVPChecklist` Component
- [ ] Checkbox-Liste mit Pflichtfeldern
- [ ] Fortschritts-Anzeige
- [ ] Notizen-Funktionalität

#### **S4.3: Workflow-Integration (0,5 Tage)**
- [ ] Status-Change-Validation
- [ ] TVP-Trigger bei "Angebot angenommen"
- [ ] E-Mail-Benachrichtigungen
- [ ] Testing & Validation

---

## 🗂️ SPRINT 5: Google Drive Integration (2-3 Tage)

### **Ziel:** Automatische Ordner-Erstellung per n8n

#### **S5.1: n8n Drive-Workflow (1 Tag)**
- [ ] Google Drive API Setup
- [ ] n8n Workflow für Ordner-Erstellung
- [ ] Tenant-spezifische Root-Ordner
- [ ] Strukturierte Unterordner-Erstellung

#### **S5.2: Frontend-Integration (1 Tag)**
- [ ] "Ordner erstellen" Button in Lead-Detail
- [ ] Drive-Link-Speicherung in Lead
- [ ] Status-Anzeige (Ordner vorhanden/nicht vorhanden)
- [ ] Error-Handling für Drive-API

#### **S5.3: Dokumenten-Upload (0,5 Tage)**
- [ ] Upload-Integration mit Drive-Ordnern
- [ ] Automatische Kategorisierung
- [ ] Metadaten-Speicherung

---

## 📅 Zeitplan & Meilensteine

### **Woche 1:**
- **Tag 1-2:** Phase 0 (Setup) + Sprint 1 Start
- **Tag 3-4:** Sprint 1 fortsetzung (Dashboard)
- **Tag 5:** Sprint 1 Abschluss + Testing

### **Woche 2:**
- **Tag 1-2:** Sprint 2 (Follow-up Automation)
- **Tag 3-5:** Sprint 3 Start (Angebots-Tools)

### **Woche 3:**
- **Tag 1-2:** Sprint 3 Fortsetzung
- **Tag 3-4:** Sprint 4 (TVP-Checkliste)
- **Tag 5:** Sprint 5 Start (Drive Integration)

### **Woche 4:**
- **Tag 1:** Sprint 5 Abschluss
- **Tag 2-3:** Integration Testing
- **Tag 4-5:** Polish & Deployment

---

## ⚡ Quick-Win Optionen

### **Wenn Zeit knapp wird, Fokus auf:**
1. **Daily Dashboard** (Sprint 1) - Höchste Priorität
2. **Angebots-Kalkulator** (Sprint 3) - Geschäftswert
3. **TVP-Checkliste** (Sprint 4) - Compliance

### **Kann später implementiert werden:**
- Follow-up Automation (manuell ist erstmal OK)
- Google Drive Integration (Supabase Storage reicht)
- Erweiterte Kalender-Integration

---

## 🛠️ Cursor-Prompts Vorbereitung

### **Nächste Aktion:**
Sobald Phase 0 abgeschlossen ist, können wir Cursor-Prompts erstellen für:

1. **Sprint 1.1:** Database Schema für Enhanced Follow-ups
2. **Sprint 1.2:** Dashboard Data Hooks & API
3. **Sprint 1.3:** Dashboard UI Components
4. **Sprint 1.4:** Dashboard Routing & Navigation

**Bereit für die Umsetzung? Soll ich mit den Cursor-Prompts für Sprint 1 anfangen?**