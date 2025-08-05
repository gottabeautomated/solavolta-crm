# 🧾 PRD: Lead-Dashboard Webapp (Mobile First, Supabase, Leaflet.js)

## 🔖 Projektname
**Lead-Dashboard Mobile**

---

## 🎯 Ziel
Eine Webapp, mit der Jonas seine Vertriebskontakte einfach verwalten, mobil einsehen, regional bündeln und direkt anrufen kann. Daten stammen aus Supabase, Geodaten über n8n. Die App ist für den mobilen Einsatz optimiert.

---

## 🧱 Tech Stack

| Bereich         | Technologie                  |
|-----------------|------------------------------|
| Frontend        | React (Cursor)               |
| Styling         | Tailwind CSS (mobile-first)  |
| Kartenfunktion  | Leaflet.js                   |
| Backend         | Supabase                     |
| Auth            | Supabase Auth (E-Mail/PW)    |
| Automationen    | n8n                          |
| Deployment      | Vercel oder Supabase Hosting |

---

## 👤 Nutzer

- **Jonas (Admin, einziger Nutzer vorerst)**
- Option für spätere Mehrnutzerfähigkeit vorbereitet

---

## 📦 Hauptfunktionen

### 1. Login (Supabase Auth)
- Eingabefeld für E-Mail und Passwort
- Zugriff nur für registrierte Nutzer (Jonas)
- Fehleranzeige bei ungültigen Login-Daten

### 2. Leadliste
- Liste aller Leads
- Felder: Name, Adresse, Leadstatus, Terminstatus
- Suchfunktion (Name, Ort, Status)
- Filter: `lead_status`, `follow_up`, `exported_to_sap`
- Klick auf Lead → Detailansicht

### 3. Lead-Detailansicht
- Zeigt alle Lead-Infos
- Bearbeitbare Felder: Status, Termin, Angebote, Notizen
- Felder: Name, Telefonnummer, Adresse, Email, Leadstatus, Termin, Telefonstatus, Angebote, Follow-up, Dokumentation, Geodaten
- Speichern direkt in Supabase

### 4. Kartenansicht (Leaflet)
- Marker für jeden Lead mit Koordinaten
- Popups zeigen: Name, Adresse, 📞 Call-Link
- Zoom auf Österreich (Stufe 8)
- Responsiv und mobil bedienbar

### 5. Direktanruf
- Telefon-Link per `tel:` in Marker und Detailansicht
- Funktioniert auf allen Smartphones

### 6. Follow-up
- Felder: `follow_up` (boolean), `follow_up_date` (date)
- Später: n8n-Reminder via Telegram oder E-Mail

### 7. Geocoding (n8n)
- Adresse wird automatisch in lat/lng umgewandelt
- n8n ruft OpenStreetMap API auf
- lat/lng werden in Supabase gespeichert
- Bei Fehler: leere Koordinaten + Logging

---

## 🗃 Supabase: Tabelle `leads`

```sql
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text,
  phone text,
  email text,
  address text,
  status_since date,
  lead_status text,
  contact_type text,
  phone_status text,
  appointment_date date,
  appointment_time text,
  offer_pv boolean,
  offer_storage boolean,
  offer_backup boolean,
  tvp boolean,
  documentation text,
  doc_link text,
  calendar_link text,
  follow_up boolean,
  follow_up_date date,
  exported_to_sap boolean,
  lat double precision,
  lng double precision
);
```

---

## 📅 Roadmap & Phasen

| Phase  | Features                                                                 |
|--------|--------------------------------------------------------------------------|
| 1      | Login, Leadliste, Detailansicht                                          |
| 2      | Kartenansicht mit Leaflet + Direktwahl                                   |
| 3      | n8n Geocoding-Workflow, Follow-up-Reminder                               |
| 4      | Erweiterungen: CSV-Import, Mehrnutzer, Dokumenten-Upload, Kalender-Export|

---

## ✅ Setup-Anleitung

1. Cursor-Projekt mit Starter-ZIP starten  
   → [lead-dashboard-starter.zip herunterladen](sandbox:/mnt/data/lead-dashboard-starter.zip)

2. Supabase-Projekt anlegen und `schema.sql` importieren

3. `.env` in Cursor definieren:
```env
VITE_SUPABASE_URL=https://deinprojekt.supabase.co
VITE_SUPABASE_ANON_KEY=xyz123abc456
```

---

## 🔜 Nächste Schritte

- [ ] n8n-Workflow für Geocoding erstellen
- [ ] Live-Test mit echten Daten
- [ ] Optional: Clustering, Farbcodierung, Upload-Funktion 