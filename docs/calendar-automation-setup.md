# Kalender-Automation Setup Guide

## 🎯 Überblick

Die Kalender-Automation ermöglicht:
- ✅ Automatische Erstellung von Terminen in Google Calendar
- ✅ Versand von Kalendereinladungen per E-Mail (ICS-Datei)
- ✅ Google Meet Links für Online-Termine
- ✅ Automatische Erinnerungen 24h vorher
- ✅ Status-Tracking (Einladung gesendet/geöffnet/akzeptiert)

---

## 📋 Voraussetzungen

### 1. Google Cloud Projekt

1. **Google Cloud Console öffnen:** https://console.cloud.google.com
2. **Neues Projekt erstellen:** "SolaVolta Calendar Integration"
3. **APIs aktivieren:**
   - Google Calendar API
   - Gmail API (für E-Mail-Versand)

### 2. OAuth2 Credentials

1. **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth 2.0 Client ID**
3. **Application type:** Web application
4. **Authorized redirect URIs:**
   ```
   https://n8n.beautomated.at/rest/oauth2-credential/callback
   ```
5. **Client ID und Secret** notieren

### 3. Service Account (optional, für Server-zu-Server)

1. **Create Credentials** → **Service Account**
2. **JSON-Key herunterladen**
3. Service Account E-Mail zu deinem Kalender als Schreibberechtigter hinzufügen

---

## 🗄️ Datenbank Setup

### 1. Erweiterte Appointments-Tabelle erstellen

Führe SQL-Script aus: `src/lib/appointments_table_extended.sql`

```bash
# In Supabase SQL Editor einfügen und ausführen
```

**Wichtige neue Felder:**
- `calendar_event_id` - Google Calendar Event ID
- `customer_email` - Empfänger der Einladung
- `invite_sent_at` - Zeitstempel Einladungsversand
- `reminder_sent_at` - Zeitstempel Erinnerung
- `meeting_type` - Art des Termins
- `meeting_link` - Google Meet Link
- `duration_minutes` - Termin-Dauer

### 2. Row Level Security (RLS) prüfen

Die erweiterten RLS Policies wurden automatisch erstellt. Prüfe:

```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'appointments';
```

---

## 🔧 n8n Workflow Setup

### 1. Workflow importieren

1. n8n öffnen: https://n8n.beautomated.at
2. **Workflows** → **Import from File**
3. Workflow aus `docs/n8n-calendar-automation-workflow.md` nachbauen

### 2. Credentials konfigurieren

#### Google Calendar OAuth2
- **Name:** `Google Calendar SolaVolta`
- **Client ID:** (aus Google Cloud Console)
- **Client Secret:** (aus Google Cloud Console)
- **Scopes:**
  ```
  https://www.googleapis.com/auth/calendar
  https://www.googleapis.com/auth/calendar.events
  ```

#### Gmail OAuth2 (für E-Mail-Versand)
- **Name:** `Gmail SolaVolta`
- **Client ID:** (aus Google Cloud Console)
- **Client Secret:** (aus Google Cloud Console)
- **Scopes:**
  ```
  https://www.googleapis.com/auth/gmail.send
  ```

#### Supabase API
- **Name:** `Supabase SolaVolta`
- **URL:** `https://YOUR_PROJECT.supabase.co`
- **Service Role Key:** (aus Supabase Dashboard → Settings → API)

### 3. Webhook-URL notieren

Nach Import des Workflows:
- **Production URL:** `https://n8n.beautomated.at/webhook/calendar-appointment`
- **Test URL:** `https://n8n.beautomated.at/webhook-test/calendar-appointment`

---

## ⚙️ Frontend Integration

### 1. Environment Variables

Füge in `.env` hinzu:

```bash
# Kalender-Automation
VITE_CALENDAR_WEBHOOK_URL=https://n8n.beautomated.at/webhook/calendar-appointment
VITE_REMINDER_WEBHOOK_URL=https://n8n.beautomated.at/webhook/appointment-reminder
VITE_CANCEL_APPOINTMENT_WEBHOOK_URL=https://n8n.beautomated.at/webhook/cancel-appointment
```

### 2. Component einbinden

In `LeadDetail.tsx` oder an gewünschter Stelle:

```typescript
import { EnhancedAppointmentForm } from './EnhancedAppointmentForm'

// In der Komponente:
const [showAppointmentForm, setShowAppointmentForm] = useState(false)

{showAppointmentForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <EnhancedAppointmentForm
      lead={lead}
      tenantId={activeTenantId}
      onSuccess={(result) => {
        console.log('Termin erstellt:', result)
        setShowAppointmentForm(false)
        // Lead-Status aktualisieren
        updateLead({ 
          id: lead.id, 
          lead_status: 'Termin vereinbart' 
        })
      }}
      onCancel={() => setShowAppointmentForm(false)}
    />
  </div>
)}
```

### 3. Button zum Öffnen

```typescript
<button
  onClick={() => setShowAppointmentForm(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  📅 Termin vereinbaren
</button>
```

---

## 📧 E-Mail-Templates anpassen

### 1. Templates bearbeiten

Passe die Templates in `docs/calendar-email-templates.md` an:
- Firmenlogo einfügen
- Kontaktdaten anpassen
- Farben an Corporate Design anpassen

### 2. In n8n übernehmen

1. **Function Node** "Render Email Template" öffnen
2. HTML-Template einfügen
3. Platzhalter-Ersetzung prüfen

### 3. Test-E-Mail versenden

```bash
curl -X POST https://n8n.beautomated.at/webhook/calendar-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-123",
    "tenantId": "YOUR_TENANT_ID",
    "customerName": "Test User",
    "customerEmail": "deine-email@example.com",
    "startDateTime": "2025-01-20T14:00:00+01:00",
    "endDateTime": "2025-01-20T15:00:00+01:00",
    "timeZone": "Europe/Berlin",
    "durationMinutes": 60,
    "meetingType": "online",
    "sendInvite": true
  }'
```

---

## ⏰ Automatische Erinnerungen

### Cron-Job für 24h-Erinnerungen einrichten

1. **Neuer Workflow:** "Appointment Reminders"
2. **Trigger:** Cron (täglich um 9:00 Uhr)
   ```
   0 9 * * *
   ```
3. **Supabase Query:**
   ```sql
   SELECT * FROM appointments_needing_reminder
   ```
4. **Loop** über Ergebnisse
5. **Reminder-E-Mail** versenden
6. **Update** `reminder_sent_at`

---

## 📊 Monitoring & Analytics

### Dashboard in Supabase erstellen

```sql
-- Einladungs-Performance
SELECT 
  DATE(invite_sent_at) as date,
  COUNT(*) as invites_sent,
  COUNT(invite_opened_at) as opened,
  COUNT(invite_accepted_at) as accepted,
  ROUND(100.0 * COUNT(invite_accepted_at) / COUNT(*), 2) as acceptance_rate
FROM appointments
WHERE invite_sent_at IS NOT NULL
GROUP BY DATE(invite_sent_at)
ORDER BY date DESC;

-- Termine nach Typ
SELECT 
  meeting_type,
  COUNT(*) as count,
  AVG(duration_minutes) as avg_duration
FROM appointments
GROUP BY meeting_type;

-- No-Show Rate
SELECT 
  COUNT(*) FILTER (WHERE status = 'no_show') as no_shows,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'no_show') / COUNT(*), 2) as no_show_rate
FROM appointments
WHERE starts_at < NOW();
```

---

## 🐛 Troubleshooting

### Problem: Einladungen werden nicht versendet

**Lösung:**
1. n8n Webhook-Logs prüfen
2. Google Calendar API Quota prüfen
3. Gmail API aktiviert?
4. OAuth2 Token abgelaufen → neu authentifizieren

### Problem: E-Mails landen im Spam

**Lösung:**
1. SPF/DKIM Records konfigurieren
2. Dedicated IP-Adresse nutzen
3. E-Mail-Template mit weniger Links
4. Plain-Text-Version mitschicken

### Problem: Google Meet Links werden nicht erstellt

**Lösung:**
1. `conferenceDataVersion` auf `1` setzen
2. `conferenceData.createRequest` korrekt formatiert?
3. Google Workspace Account erforderlich (nicht Free Gmail)

### Problem: Termine erscheinen nicht in Supabase

**Lösung:**
1. Webhook-Response prüfen
2. RLS Policies korrekt?
3. `tenant_id` wird mitgesendet?
4. Supabase Service Role Key verwendet?

---

## ✅ Testing-Checkliste

- [ ] Termin erstellen ohne Einladung
- [ ] Termin erstellen mit Einladung
- [ ] E-Mail empfangen mit ICS-Datei
- [ ] ICS-Datei zu Kalender hinzufügen
- [ ] Google Meet Link funktioniert
- [ ] Erinnerung 24h vorher erhalten
- [ ] Termin stornieren
- [ ] Stornierungsemail erhalten
- [ ] Daten in Supabase korrekt
- [ ] RLS verhindert Zugriff auf fremde Termine

---

## 📚 Weitere Ressourcen

- [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)
- [RFC 5545 (iCalendar)](https://datatracker.ietf.org/doc/html/rfc5545)
- [n8n Documentation](https://docs.n8n.io)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## 🚀 Go-Live

### Pre-Launch Checkliste

1. **Production Keys einsetzen:**
   - Google OAuth2 Credentials (Production)
   - Gmail SMTP Production Account
   - Supabase Production Project

2. **E-Mail-Domain verifizieren:**
   - SPF Record setzen
   - DKIM konfigurieren
   - DMARC Policy definieren

3. **Rate Limits prüfen:**
   - Google Calendar API: 1.000.000 requests/day
   - Gmail API: 1.000.000.000 quota units/day

4. **Monitoring aktivieren:**
   - n8n Error-Alerts
   - Supabase Database Health
   - E-Mail Delivery Rate

5. **Backup-Strategie:**
   - Supabase Auto-Backups aktiviert
   - n8n Workflows exportiert
   - Templates versioniert

### Nach Go-Live

- [ ] Erste 10 Termine manuell prüfen
- [ ] Kunden-Feedback einholen
- [ ] Annahmeraten tracken
- [ ] Optimierungen basierend auf Daten

---

**Support:** Bei Fragen → docs/README.md oder n8n Community Forum

