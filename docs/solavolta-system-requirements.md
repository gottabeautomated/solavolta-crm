# SolaVolta Sales Pipeline System
## Vollständige Anforderungsdokumentation

*Version 1.0 - August 2025*

---

## 🎯 Projektübersicht

**Ziel:** Vollständiges Sales-Pipeline-Management-System für die Solarbranche mit automatisierten Workflows, strukturierter Lead-Verfolgung und intelligenter Angebotserstellung.

**Kern-Problem:** Unstrukturiertes Lead-Management führt zu verlorenen Kunden und ineffizienten Verkaufsprozessen.

**Lösung:** Digitales System das den kompletten Verkaufsprozess von SAP-Import bis Projektabschluss abbildet.

---

## 📋 System-Architektur

### **Tech-Stack:**
- **Frontend:** React (Multi-Tenant-fähig) 
- **Backend:** API mit Tenant-Isolation
- **Database:** PostgreSQL mit Row-Level Security
- **Automation:** n8n für komplexe Workflows
- **Storage:** Supabase (temporär) + Google Drive (permanent)
- **Kalender:** Outlook/Google Calendar Integration

### **Multi-Tenant-Basis (✅ Bereits implementiert):**
- Tenant-Isolation auf DB-Ebene
- JWT-basierte Authentication mit Tenant-Context
- Separierte Datenstrukturen pro Kunde

---

## 🔄 Lead-Lifecycle & Status-Pipeline

```
SAP-Import → Kontaktaufnahme → Termin → Vor-Ort → Angebot → TVP → Gewonnen
     ↓           ↓             ↓        ↓         ↓      ↓      ↓
   Manual    Wiedervorlage  Kalender  Doku    Timer  Liste  Archive
```

### **Lead-Status-Definitionen:**
1. **Neu** - Aus SAP importiert, noch nicht kontaktiert
2. **Kontakt aufgenommen** - Erstkontakt erfolgt
3. **Nicht erreicht** - Automatische Wiedervorlage nach 2/5/10 Tagen
4. **Termin vereinbart** - Vor-Ort-Termin geplant
5. **Termin durchgeführt** - Besichtigung abgeschlossen
6. **Angebot erstellt** - In Angebotserstellung/Kalkulation
7. **Angebot versandt** - Automatischer 7-Tage-Timer
8. **Angebotspflege** - Nachverhandlung läuft
9. **TVP erforderlich** - Technisches Vertriebs-Protokoll
10. **Gewonnen** - Auftrag erhalten
11. **Verloren** - Mit Verlustgrund

---

## 🏠 Core Features

### **1. Daily Operations Dashboard**
**Priorität: HOCH** ⭐⭐⭐

```
┌─────────────────────────────────────────┐
│ 📅 Heute - 13. August 2025             │
├─────────────────────────────────────────┤
│ 🔴 ÜBERFÄLLIG (2)                      │
│ • Kunde Müller - Nachfassen seit 3 Tagen│
│ • Angebot Schmidt - Timer abgelaufen    │
│                                         │
│ ⏰ HEUTE FÄLLIG (4)                     │
│ • 09:00 Termin - Vor-Ort Besichtigung  │
│ • 14:00 Anruf - Nachfassen Angebot     │
│ • 16:00 Wiedervorlage - Kunde Weber    │
│                                         │
│ 📋 DIESE WOCHE                          │
│ • Morgen: 2 Termine, 1 Nachfassen      │
│ • Übermorgen: 3 Wiedervorlagen         │
└─────────────────────────────────────────┘
```

**Features:**
- Überfällige Aktionen (rot markiert)
- Heute fällige Termine/Wiedervorlagen
- Wochenübersicht
- Schnellaktionen pro Lead

### **2. Automatisches Wiedervorlage-System**
**Priorität: HOCH** ⭐⭐⭐

**Automatische Timer:**
- **Nicht erreicht:** 2 Tage → 5 Tage → 10 Tage
- **Angebot versandt:** 7 Tage automatische Nachfrage
- **Angebotspflege:** Configurable Intervalle
- **Termin überfällig:** Sofortige Eskalation

**Manuelle Wiedervorlagen:**
- Freie Datumswahl
- Notizen/Grund erforderlich
- Prioritäts-Level (Niedrig/Normal/Hoch)

### **3. Lead-Ordner-Management**
**Priorität: MITTEL** ⭐⭐

**Automatische Ordner-Erstellung per Button:**
```
📁 {LeadName}_{LeadID}/
├── 📁 Angebote/
├── 📁 Fotos/
├── 📁 Drohnenbilder/
├── 📁 Vorort-Aufnahmen/
├── 📁 Skizzen/
├── 📁 Notizen/
└── 📁 Kundendokumente/
```

**Integration:**
- n8n Workflow für Ordner-Erstellung
- Google Drive API
- Tenant-spezifische Root-Ordner
- Automatische URL-Speicherung im Lead

### **4. Intelligente Angebots-Checkliste**
**Priorität: HOCH** ⭐⭐⭐

**Basierend auf SolaVolta-Standards:**

```
┌─────────────────────────────────────────┐
│ 📋 SolaVolta Angebots-Kalkulator       │
├─────────────────────────────────────────┤
│ 🏠 PROJEKT-BASICS                       │
│ ├─ Gewünschte kWp: [13,2] → 29 Module   │
│ ├─ PLZ: [3100] → Zone 3 (Standard)     │
│ ├─ Kabellänge: [30] Meter              │
│ └─ Dachtyp: [Ziegel ▼] → Eco-Montage   │
│                                         │
│ ⚡ AUTO-KALKULATION                     │
│ ├─ Fixer Abschlag: 13,2kWp x 250€ = 3.300€│
│ ├─ Montagepauschale: 29 x 116€ = 3.364€│
│ ├─ Leitungsführung: 30m x 11,17€ = 335€│
│ ├─ Anfahrt: 560€ (Standard)            │
│ ├─ Logistik: 111€                      │
│ └─ Gesamt Montage: 4.370€              │
│                                         │
│ 🔧 STANDARD-KOMPONENTEN                 │
│ ├─ ✅ Module: Trina TSM-455 (29 Stk.)  │
│ ├─ ✅ WR: [SolaX ▼] X3-Hybrid-12.0-D   │
│ ├─ ✅ UK: Eco-System                   │
│ └─ ✅ Zubehör: SMA Smart Meter, etc.   │
│                                         │
│ 📄 SAP-POSITIONEN                       │
│ ├─ ⏳ Alle Positionen generiert         │
│ ├─ ❌ In SAP übertragen                 │
│ └─ ❌ Angebot erstellt                  │
└─────────────────────────────────────────┘
```

**Automatische Berechnungen:**
- **Module-Anzahl:** kWp ÷ 0,455 (Trina TSM-455)
- **Fixer Abschlag:** kWp × 250€
- **Montagepauschale:** Module × 116€ (Eco)
- **PLZ-Aufschläge:** Automatisch basierend auf Zone
- **Dachtyp-Abschläge:** -34€/Modul bei einfacher Deckung

**Standard-Komponenten:**
- **Module:** Trina TSM-455 (455W)
- **Wechselrichter:** SolaX, Huawei, Fronius
- **Zusätzliche Positionen:** Siehe Excel-Kalkulationsbasis

### **5. TVP-Checkliste (Technisches Vertriebs-Protokoll)**
**Priorität: MITTEL** ⭐⭐

**Pflicht-Checkliste vor "Gewonnen"-Status:**
- Technische Machbarkeit bestätigt
- Netzanschluss geklärt
- Genehmigungen eingeholt
- Installationstermin vereinbart
- Kundendokumentation vollständig

**Workflow:**
```
Angebot angenommen → TVP-Checkliste → Alle Punkte ✅ → "Gewonnen" möglich
```

---

## 📊 Datenbank-Schema

### **Bestehende Tabellen (Multi-Tenant):**
- `tenants` - Mandanten-Verwaltung
- `users` - Benutzer mit Tenant-Zuordnung  
- `leads` - Kern-Lead-Daten

### **Neue Tabellen:**

```sql
-- Wiedervorlagen-System
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  type ENUM('call', 'offer_followup', 'meeting', 'custom'),
  due_date DATE,
  priority ENUM('low', 'medium', 'high', 'overdue'),
  auto_generated BOOLEAN,
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP
);

-- Lead-Ordner-Tracking
ALTER TABLE leads ADD COLUMN drive_folder_id VARCHAR(255);
ALTER TABLE leads ADD COLUMN drive_folder_url TEXT;

-- Angebots-Kalkulation
CREATE TABLE lead_calculations (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  kwp_planned DECIMAL(5,2),
  modules_count INTEGER,
  cable_length INTEGER,
  plz VARCHAR(10),
  roof_type VARCHAR(50),
  mounting_cost DECIMAL(10,2),
  fixed_discount DECIMAL(10,2),
  total_mounting DECIMAL(10,2),
  calculation_data JSONB, -- Speichert alle Berechnungsdetails
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- TVP-Checkliste
CREATE TABLE tvp_checklists (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  technical_feasibility BOOLEAN DEFAULT FALSE,
  grid_connection_cleared BOOLEAN DEFAULT FALSE,
  permits_obtained BOOLEAN DEFAULT FALSE,
  installation_scheduled BOOLEAN DEFAULT FALSE,
  documentation_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  completed_by UUID REFERENCES users(id),
  notes TEXT
);

-- Lead-Status-History
CREATE TABLE lead_status_history (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changed_at TIMESTAMP,
  changed_by UUID REFERENCES users(id),
  auto_trigger BOOLEAN DEFAULT FALSE,
  loss_reason TEXT, -- Bei Status "Verloren"
  notes TEXT
);
```

---

## 🚀 API-Endpunkte

### **Dashboard APIs:**
```
GET  /api/dashboard/today           - Heutige Übersicht
GET  /api/dashboard/overdue         - Überfällige Aktionen
GET  /api/dashboard/week            - Wochenübersicht
```

### **Lead-Management APIs:**
```
POST /api/leads                     - Lead erstellen/importieren
GET  /api/leads                     - Lead-Liste (gefiltert)
PUT  /api/leads/{id}/status         - Status ändern (triggert Workflows)
POST /api/leads/{id}/folder         - Drive-Ordner erstellen
GET  /api/leads/{id}/calculation    - Angebots-Kalkulation
PUT  /api/leads/{id}/calculation    - Kalkulation speichern/updaten
```

### **Wiedervorlage APIs:**
```
GET  /api/follow-ups                - Wiedervorlagen-Liste
POST /api/follow-ups                - Neue Wiedervorlage erstellen
PUT  /api/follow-ups/{id}/complete  - Wiedervorlage abschließen
```

### **TVP-Checkliste APIs:**
```
GET  /api/leads/{id}/tvp            - TVP-Status abrufen
PUT  /api/leads/{id}/tvp            - TVP-Checkliste updaten
POST /api/leads/{id}/tvp/complete   - TVP abschließen
```

---

## 🤖 n8n Automations

### **1. Lead-Status-Workflows:**
- **Status "Nicht erreicht"** → Wiedervorlage in 2 Tagen
- **Status "Angebot versandt"** → Nachfass-Timer 7 Tage
- **Überfällige Wiedervorlagen** → Eskalation/Benachrichtigung

### **2. Kalender-Integration:**
- **Termin vereinbart** → Automatischer Kalendereintrag
- **Vor-Ort-Termine** → Kunde per E-Mail einladen
- **Erinnerungen** → SMS/E-Mail vor Terminen

### **3. Ordner-Management:**
- **Drive-Ordner-Erstellung** → Strukturierte Ablage
- **Dokument-Upload** → Automatische Kategorisierung

---

## 📈 Entwicklungs-Roadmap

### **Sprint 1 - Foundation (1 Woche)**
**Priorität: KRITISCH**
- [ ] Lead-Status-Pipeline implementieren
- [ ] Basic Dashboard mit Heute/Überfällig
- [ ] Wiedervorlage-System (manuell + automatisch)
- [ ] Lead-Status-History

### **Sprint 2 - Automation (1 Woche)**  
**Priorität: HOCH**
- [ ] n8n Integration für Status-Trigger
- [ ] Automatische Wiedervorlagen-Timer
- [ ] E-Mail/SMS-Benachrichtigungen
- [ ] Kalender-Sync (Basic)

### **Sprint 3 - Angebots-Tools (1 Woche)**
**Priorität: HOCH**
- [ ] Angebots-Kalkulator mit SolaVolta-Logik
- [ ] Komponenten-Datenbank (Trina, SolaX, etc.)
- [ ] SAP-Position-Generator
- [ ] TVP-Checkliste

### **Sprint 4 - Dokumenten-Management (1 Woche)**
**Priorität: MITTEL**
- [ ] Google Drive Ordner-Automation
- [ ] Foto/Dokument-Upload-Workflows
- [ ] Mobile-optimierte Dokumentation

### **Sprint 5 - Polish & Optimization (1 Woche)**
**Priorität: NIEDRIG**
- [ ] Advanced Reporting/Analytics
- [ ] Performance-Optimierung
- [ ] Enhanced UI/UX
- [ ] Mobile App (optional)

---

## 🎯 Success Metrics

### **Effizienz-Steigerung:**
- **50% weniger** vergessene Follow-ups
- **30% schnellere** Angebotserstellung
- **90% vollständige** Checklisten-Compliance

### **Conversion-Verbesserung:**
- **15% höhere** Lead-zu-Termin-Rate
- **20% mehr** gewonnene Angebote
- **Reduzierte** Verlust-Rate durch besseres Timing

### **Zeit-Ersparnis:**
- **60 Min/Tag** durch automatisierte Workflows
- **30 Min/Angebot** durch Kalkulations-Automation
- **Zero** manuelle Wiedervorlage-Verwaltung

---

## 💡 Future Enhancements

### **Phase 2 Features:**
- **KI-basierte** Lead-Scoring
- **Automatische** Termin-Buchung für Kunden
- **WhatsApp-Integration** für Kundenkommunikation
- **IoT-Integration** für Anlagen-Monitoring
- **Vollständige SAP-Integration** (bidirektional)

### **Skalierung:**
- **White-Label-Lösung** für andere Solar-Unternehmen
- **Franchising-Features** für Vertriebs-Teams
- **API-Marketplace** für Drittanbieter-Integrationen

---

## 📝 Nächste Schritte

1. **✅ Anforderungen dokumentiert** (dieser PRD)
2. **⏳ Sprint 1 Cursor-Prompts erstellen**
3. **⏳ Development Environment Setup**
4. **⏳ Sprint 1 Implementation**
5. **⏳ Testing & Feedback**
6. **⏳ Sprint 2 Planning**

---

*Dokumentation erstellt: August 2025*  
*Nächste Review: Nach Sprint 1*