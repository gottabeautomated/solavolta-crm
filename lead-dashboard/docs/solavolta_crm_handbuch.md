# SolaVolta CRM - Benutzerhandbuch

## Inhaltsverzeichnis

1. [Quick Start](#quick-start)
2. [Lead-Workflow](#lead-workflow)
3. [Kontaktprozess & Automatisierung](#kontaktprozess)
4. [Termine & Kalenderintegration](#termine)
5. [Dashboard & KPIs](#dashboard)
6. [Listen & Kartenansicht](#listen-karten)
7. [Angebotsverwaltung](#angebote)
8. [Fehlerbehebung](#troubleshooting)
9. [Glossar](#glossar)

---

## 1. Quick Start {#quick-start}

### Die wichtigsten Aktionen im Überblick

**Neuen Lead erfassen:**
- Lead-Daten eingeben → Status "Neu" → Automatisches Follow-up für heute erstellt

**Lead kontaktieren:**
- Dashboard → "Heute kontaktieren" → Lead öffnen → Telefonversuch dokumentieren

**Termin vereinbaren:**
- Erreicht → "Termin vereinbaren" → Datum/Zeit/Kanal → Webhook-Integration startet automatisch

**Angebot erstellen:**
- Status "Angebot angefragt" → Datei hochladen → Automatische Betragsextraktion → Follow-up generiert

### Navigation

- **Dashboard**: Übersicht, Aufgaben, KPIs
- **Leads**: Vollständige Leadliste mit Filtern  
- **Karte**: Geografische Ansicht für Routenplanung
- **Angebote**: Angebotsverwaltung und -archiv

---

## 2. Lead-Workflow {#lead-workflow}

### Quellen der Wahrheit

Das System basiert auf vier zentralen Datenquellen:

- **`leads`**: Stammdaten und aktueller Status
- **`appointments`**: Alle Termine mit Webhook-Integration
- **`enhanced_follow_ups`**: Automatisierte Wiedervorlagen
- **`contact_attempts`**: Vollständiges Kontaktprotokoll

### Status-Logik: Der komplette Workflow

```
Neu → (Kontaktversuch) → Nicht erreicht 1x/2x/3x
                      → In Bearbeitung → Termin vereinbart
                                     → Angebot angefragt
                                     → Angebot erstellt
                                     → Verloren / Gewonnen
```

#### Eingangsstatus
**Neu**
- SLA: Erstkontakt binnen 24h
- Automatisches Follow-up: Heute
- Priorität: Hoch bis zur ersten Kontaktaufnahme

#### Kontakt-Kaskade  
**Nicht erreicht (1x/2x/3x)**
- 1x: Follow-up +1 Arbeitstag
- 2x: Follow-up +6 Arbeitstage + Team-Benachrichtigung
- 3x: Follow-up +10 Arbeitstage + Automatische Kunden-E-Mail via Webhook

#### Bearbeitungsphase
**In Bearbeitung** (Sammelstatus für aktive Leads)

**Termin vereinbart**
- Automatische Kalenderintegration
- Reminder-Follow-up am Vortag
- Bestätigungs-E-Mail an Kunden

**Angebot angefragt**
- SLA: Angebot binnen 2 Arbeitstagen
- Automatisches Follow-up "Angebot erstellen"

**Angebot erstellt**
- Follow-up "Nachfassen #1": +3 Arbeitstage
- Follow-up "Nachfassen #2": +7 Arbeitstage

#### Abschluss
**Gewonnen**: Automatische Projektübergabe via Webhook
**Verloren**: Revival-Follow-up in 30 Tagen

#### Sonderstatus
**Pausiert bis [Datum]**: Keine Follow-ups bis zum Stichtag
**Dublette**: Finale Markierung, keine weiteren Aktionen

---

## 3. Kontaktprozess & Automatisierung {#kontaktprozess}

### Telefonversuch dokumentieren

#### Nicht erreicht
**Optionen:**
- "Mailbox": Nachricht hinterlassen
- "Telefon aus": Kein Kontakt möglich

**Automatische Aktionen:**
- Erhöhung des "Nicht erreicht"-Zählers
- Automatische Planung des nächsten Versuchs
- Eintrag im Kontaktprotokoll

#### Erreicht - Verschiedene Szenarien

**1. Termin vereinbaren**
```
Datum + Uhrzeit festlegen 
→ Kanal wählen (Telefon/Video/Vor-Ort)
→ "Termin durchgeführt" Option für Nachbearbeitung
→ Webhook startet Terminautomatisierung
```

**2. Angebot angefragt**
```
Status → "Angebot angefragt"
→ Automatisches Follow-up "Angebot erstellen" (SLA: 2 Tage)
→ Team-Benachrichtigung
```

**3. Weitere Aktion planen**
```
Wiedervorlage festlegen
→ Datum/Zeit auswählen
→ Automatisches Follow-up generiert
```

### Enhanced Follow-ups (EFU)

#### Auto-Generierung nach Status

| Status | Follow-up Typ | Zeitraum | Automatisch |
|--------|---------------|----------|-------------|
| Neu | Erstkontakt | Heute | ✓ |
| Nicht erreicht 1x | Kontaktversuch | +1 Arbeitstag | ✓ |
| Nicht erreicht 2x | Kontaktversuch | +6 Arbeitstage | ✓ |
| Nicht erreicht 3x | E-Mail + Anruf | +10 Arbeitstage | ✓ |
| Termin vereinbart | Reminder | 1 Tag vorher | ✓ |
| Angebot angefragt | Angebot erstellen | +2 Arbeitstage | ✓ |
| Angebot erstellt | Nachfassen #1 | +3 Arbeitstage | ✓ |
| Angebot erstellt | Nachfassen #2 | +7 Arbeitstage | ✓ |
| Verloren | Revival | +30 Tage | ✓ |

#### EFU-Typen und Fälligkeiten

**Fälligkeitslogik:**
- Überfällig: Rot markiert, hohe Priorität
- Heute fällig: Gelb markiert, normale Priorität  
- Zukünftig: Standard-Priorität

**Arbeitstagberechnung:**
- Wochenenden ausgeschlossen
- Feiertage berücksichtigt
- Zeitzone korrekt (Europa/Berlin)

### "Heute kontaktieren"-Regeln

#### Sichtbare Leads im Dashboard
**Kriterien für Anzeige:**
- Status "Neu" mit Follow-up heute/überfällig
- Status "Nicht erreicht" (1x/2x/3x) mit fälligem Follow-up
- Status "In Bearbeitung" mit Terminen heute
- Alle EFUs mit Typ "Kontaktversuch" oder "Nachfassen"

**Ausgeblendet:**
- Status "Verloren", "Gewonnen", "Pausiert bis", "Dublette"
- Leads ohne fällige Follow-ups
- Bereits heute kontaktierte Leads (optional)

---

## 4. Termine & Kalenderintegration {#termine}

### Termin-Erstellung

#### Im Lead-Formular
**Vorgang:**
1. Lead öffnen → "Telefonversuch" → "Erreicht"  
2. "Termin vereinbaren" aktivieren
3. **Datum/Zeit**: Datepicker mit Zeitzonenkorrektheit
4. **Kanal**: Telefon, Video-Call, Vor-Ort-Termin
5. **"Termin durchgeführt"**: Checkbox für abgeschlossene Termine

#### Automatische Aktionen
**Bei Terminerstellung:**
- Webhook "Workflow starten" wird getriggert
- Kalenderintegration (falls konfiguriert)
- Bestätigungs-E-Mail an Kunden
- Follow-up "Termin-Reminder" am Vortag

#### Webhook-Integration
**Konfiguration:**
- Primary: Webhook-URL für Terminautomatisierung
- Fallback: Interne Benachrichtigung falls Webhook fehlschlägt
- Retry-Logic: 3 Versuche mit exponential backoff

### Termine löschen/verschieben

**Berechtigung:** Nur berechtigte Benutzer
**Aktion:** 
- Termin aus `appointments` entfernen
- Webhook "Termin storniert" senden
- Follow-up "Neuen Termin vereinbaren" erstellen

---

## 5. Dashboard & KPIs {#dashboard}

### Übersichtskacheln

#### Aufgaben & SLA
**Überfällig** (Rot)
- Anzahl überfälliger EFUs
- Klick → Detailliste in Sidebar

**Heute fällig** (Gelb)  
- Follow-ups für heute
- Termine heute
- SLA-kritische Leads

**SLA Kontakt >24h** (Ampelsystem)
- 🔴 Überfällig | 🟡 Heute fällig | 🟢 Rechtzeitig
- Neue Leads ohne Erstkontakt
- In Bearbeitung ohne Aktivität >24h

#### Geschäftskennzahlen
**Angebote offen**
- Anzahl Status "Angebot erstellt"
- Gesamtwert aus `offer_amount`

**Conversion 30d**
- RPC-basierte Berechnung: `get_sales_kpis()`
- Gewonnen vs. Verloren der letzten 30 Tage

**Offers-Wert**  
- Summe aller `leads.offer_amount` mit Status "Angebot erstellt"
- Echtzeitaktualisierung

**Gewonnen-Wert 30d**
- Summe der letzten 30 Tage mit Status "Gewonnen"
- Projektionslogik für Pipeline-Prognose

### Wochenkalender & Prioritäten

**Kommende Termine:**
- Aus `appointments` Tabelle
- Chronologische Sortierung
- Direkter Sprung zu Lead-Details

**Prioritäten-Widget:**
- Überfällige EFUs (höchste Priorität)
- SLA-kritische Leads
- Hochwert-Angebote (>50k€)

---

## 6. Listen & Kartenansicht {#listen-karten}

### Lead-Liste

#### Inline-Status-Änderung
**Funktion:** Linsen-Symbol (🔍) neben Status
**Verwendung:**
- Klick → Status-Dropdown öffnet sich
- Auswahl → Sofortige Änderung ohne Formular
- Automatische EFU-Generierung nach neuer Status-Logik

#### Filter & Suche
**Hauptfilter:**
- Schnellsuche: Name, Telefon, Adresse, PLZ
- Status-Filter: Multi-Select möglich
- Prioritäts-Filter: Hoch, Mittel, Niedrig
- Datumsbereich: Erstellungsdatum, letzte Aktivität

**Archiv-Behandlung:**
- Badge "Archiviert" bei Status "Verloren"/"Gewonnen" 
- Standardmäßig ausgeblendet
- "Archiv anzeigen"-Schalter für Vollansicht

### Kartenansicht

#### Marker-System
**Farbcodierung nach Status:**
- Neu: Blau
- Nicht erreicht: Orange
- In Bearbeitung: Grün
- Termin vereinbart: Violett
- Angebot erstellt: Gold
- Gewonnen: Dunkelgrün
- Verloren: Grau

**Prioritäts-Marker:**
- Hohe Priorität: Größerer Marker mit Ausrufezeichen
- Überfällige EFUs: Pulsierender Marker
- SLA-Kritisch: Rotes Blinken

#### Performance-Optimierung
**Viewport-Loading:**
- Nur sichtbare Marker laden
- Lazy Loading bei Zoom/Pan
- Clustering bei >100 Markern

**Marker-Limit:**
- Maximum 500 Marker gleichzeitig
- Filter-Empfehlung bei Überschreitung
- Performance-Warnung im Browser

---

## 7. Angebotsverwaltung {#angebote}

### Angebots-Speicherung

#### Storage-System
**Zwei Buckets:**
- `offers`: Standard-Angebote (PDF, DOCX)
- `tvp`: Technische Vorplanungen (CAD, spezielle Formate)

**JSON-Integration in Lead:**
```json
{
  "offers": [
    {
      "typ": "Standard",
      "datum": "2024-03-15",
      "nummer": "ANB-2024-001", 
      "bucket": "offers",
      "pfad": "kunde_2024/angebot_15000.pdf",
      "betrag": 15000.00
    }
  ]
}
```

### Automatische Betragsextraktion

#### Edge Function: offer-parse
**Trigger:** Automatisch nach Datei-Upload
**Methoden:**
1. **Dateiname-Parsing**: "Angebot_2024_15000_Euro.pdf" → 15000
2. **PDF-Text-Analyse**: OCR + Regex für Preisangaben  
3. **Fallback**: Manuelle Eingabe im Formular

**Update-Logik:**
- Schreibt `offers[].amount` UND `offer_amount` (Kompatibilität)
- Idempotent: Mehrfache Verarbeitung ohne Probleme
- Fehlerbehandlung: Logging + Fallback-Benachrichtigung

### Backfill für bestehende Angebote

**SQL-Script:** `add_offers_backfill_from_storage.sql`
```sql
-- Idempotentes Script - mehrfache Ausführung OK
-- Scannt Storage Buckets und ordnet bestehende Dateien zu
-- Automatische Betragsextraktion aus Dateinamen
```

**Anwendung:**
- Bei Migration bestehender Systeme
- Nach Storage-Reorganisation  
- Zur Datenbereinigung

---

## 8. Fehlerbehebung {#troubleshooting}

### Datenquellen-Probleme

#### Views mit SECURITY INVOKER
**Problem:** RLS-Fehler oder leere Resultate
**Lösung:**
```sql
-- Views neu erstellen mit korrekten Berechtigungen
DROP VIEW IF EXISTS lead_with_details CASCADE;
CREATE VIEW lead_with_details WITH (security_invoker=true) AS ...
```

#### pgrst Schema Reload
**Problem:** API zeigt veraltete Datenstruktur
**Lösung:**
```bash
# PostgREST Schema-Cache aktualisieren
curl -X POST "your-api-url/rpc/pgrst_reload_schema"
```

### Migration & Cleanup

#### Alte Felder entfernen
**Backup vor Änderungen:**
```sql
-- Backup kritischer Daten
CREATE TABLE leads_backup AS SELECT * FROM leads;
```

**Idempotente Löschung:**
```sql
-- Prüfung vor Löschung
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name='leads' AND column_name='old_field') 
  THEN 
    ALTER TABLE leads DROP COLUMN old_field;
  END IF; 
END $$;
```

### Webhook-Probleme

#### Terminautomatisierung fehlgeschlagen
**Diagnostik:**
1. Webhook-URL erreichbar? (curl-Test)
2. Request-Format korrekt? (JSON-Schema prüfen)
3. Retry-Logic funktioniert? (Log-Analyse)

**Fallback-Aktionen:**
- Manuelle Terminbenachrichtigung
- Lead-Kommentar mit Fehlerdetails
- Admin-Benachrichtigung

### Performance-Issues

#### Dashboard lädt langsam
**Optimierung:**
1. **KPI-Caching**: RPC-Ergebnisse für 5 Minuten cachen
2. **Filter-Indizes**: Neue Indizes auf häufig gefilterte Spalten
3. **Query-Optimierung**: N+1-Probleme in Lead-Abfragen eliminieren

#### Kartenansicht langsam
**Lösungsansätze:**
1. **Viewport-Grenzen**: Nur sichtbare Marker laden
2. **Marker-Clustering**: Automatisch bei >100 Markern
3. **Lazy Loading**: Progressive Nachladung beim Scrollen

---

## 9. Glossar {#glossar}

**EFU**: Enhanced Follow-Up - intelligente, automatisierte Wiedervorlage  
**SLA**: Service Level Agreement - definierte Reaktionszeiten (z.B. 24h für Erstkontakt)  
**RPC**: Remote Procedure Call - Datenbank-Funktionen für KPI-Berechnungen  
**RLS**: Row Level Security - mandanten-isolierte Datensicherheit  
**Tenant**: Mandant - isolierter Datenbereich pro Unternehmen  
**Webhook**: HTTP-Callback für externe Systemintegration  
**Backfill**: Nachträgliche Befüllung von Datenstrukturen  
**SECURITY INVOKER**: PostgreSQL-View mit Benutzerrechten des Aufrufenden  

### Wichtige Konstanten

**Zeiträume:**
- SLA Erstkontakt: 24 Stunden
- Angebot-SLA: 2 Arbeitstage  
- Revival-Abstand: 30 Tage
- KPI-Standard: 30 Tage rückblickend

**Status-Hierarchie:**
- Eingangsstatus: Neu
- Aktive Bearbeitung: In Bearbeitung, Termin vereinbart, Angebot erstellt
- Abschluss-Status: Gewonnen, Verloren
- Sonder-Status: Pausiert bis, Dublette

**Storage-Buckets:**
- `offers`: Standard-Angebote (PDF, DOCX)
- `tvp`: Technische Vorplanungen

---

## Quick Reference - Die wichtigsten Aktionen

### Täglicher Workflow
1. **Dashboard öffnen** → Überfällige und heute fällige Aufgaben prüfen
2. **"Heute kontaktieren"** → Leads systematisch abarbeiten  
3. **Termine dokumentieren** → Automatisierung läuft
4. **Angebote nachfassen** → Follow-ups werden generiert

### Lead-Lifecycle  
```
Neu → Kontakt → Termin → Angebot → Gewonnen
       ↓         ↓        ↓        ↓
   Nicht    Verschoben  Abgelehnt Verloren
  erreicht
```

### Eskalationspfade
- **Nicht erreicht 3x**: Automatische E-Mail-Kampagne
- **Angebot >48h**: Teamleiter-Benachrichtigung  
- **SLA-Verstoß**: Prioritäts-Eskalation
- **Hochwert-Lead**: Manuelle Prüfung erforderlich

---

*Version 2.0 - Optimiert für den aktualisierten Lead-Workflow*


