# 📅 Kalender-Automation mit automatischen Kundeneinladungen

## 🎯 Was wurde implementiert?

Eine vollständige Kalender-Automation, die:
- ✅ Termine in Google Calendar erstellt
- ✅ Automatisch Einladungen per E-Mail versendet (mit ICS-Datei)
- ✅ Google Meet Links für Online-Termine generiert
- ✅ 24h-Erinnerungen automatisch versendet
- ✅ Status-Tracking für Einladungen (gesendet/geöffnet/akzeptiert)
- ✅ Vor-Ort, Online und Telefon-Termine unterstützt

---

## 📁 Erstellte Dateien

### Backend / Database

#### 1. `src/lib/appointments_table_extended.sql`
Erweiterte Datenbank-Struktur mit:
- Neuen Feldern für Kalender-IDs, Einladungsstatus
- RLS Policies für Tenant-Isolation
- Views für Reporting und n8n-Integration
- Trigger für automatische Timestamps

**Nächster Schritt:** In Supabase SQL Editor ausführen

---

#### 2. `src/lib/calendarService.ts`
TypeScript Service für Kalender-Operations:
- `createAppointmentWithInvite()` - Hauptfunktion
- `sendReminder()` - Erinnerungen versenden
- `cancelAppointment()` - Termine stornieren
- Helper-Funktionen für Zeit und Validierung

**Features:**
- ICS-Datei Generierung
- Google Calendar Event Objekte
- Webhook-Integration mit n8n
- Zeit-Slot-Generator

---

### Frontend / UI

#### 3. `src/components/EnhancedAppointmentForm.tsx`
Moderne, benutzerfreundliche Termin-Erstellung:

**Features:**
- 📅 Datum/Zeit-Picker mit Validierung
- 🎯 Meeting-Type Auswahl (Vor Ort / Online / Telefon)
- 📧 Optional: Kalendereinladung versenden
- 💻 Automatische Google Meet Links
- 📝 Notizen und Kundendaten
- ✅ Live-Feedback und Error-Handling

**UI-Highlights:**
- Responsive Design
- Loading States
- Success/Error Messages
- Conditional Fields basierend auf Meeting-Type

---

#### 4. `src/types/appointments.ts`
Type-Safe TypeScript Definitionen:
- `Appointment` - Vollständiges Appointment-Interface
- `AppointmentWithLead` - Join mit Lead-Daten
- `CreateAppointmentInput` - API Input
- `AppointmentInviteStatus` - Tracking
- `CalendarEventMetadata` - Externe Kalender-Infos

---

### n8n Workflows

#### 5. `docs/n8n-calendar-automation-workflow.md`
Komplette n8n Workflow-Dokumentation:

**Workflow-Schritte:**
1. Webhook Trigger
2. Input Validation
3. Google Calendar Event erstellen
4. ICS-Datei generieren
5. E-Mail Template rendern
6. E-Mail mit Anhang versenden
7. Supabase Update
8. Response zurücksenden

**Zusatz-Workflows:**
- Terminerinnerungen (Cron-Job)
- Termin-Stornierung
- Status-Updates

---

### Templates & Dokumentation

#### 6. `docs/calendar-email-templates.md`
Professionelle E-Mail-Templates (HTML + Plain-Text):

**Templates:**
1. **Termineinladung** - Initiale Bestätigung
2. **Terminerinnerung** - 24h vor dem Termin
3. **Termin-Stornierung** - Bei Absage

**Features:**
- Responsive HTML-Design
- Corporate Branding
- Platzhalter-System
- ICS-Anhang
- Call-to-Actions

---

#### 7. `docs/calendar-automation-setup.md`
Vollständiger Setup-Guide:

**Inhalte:**
- Google Cloud Projekt Setup
- OAuth2 Credentials
- Datenbank Migration
- n8n Workflow Import
- Frontend Integration
- Testing-Checkliste
- Troubleshooting
- Go-Live Checklist

---

## 🚀 Quick Start

### 1. Datenbank Setup (5 Min)

```bash
# In Supabase SQL Editor:
# 1. Datei öffnen: src/lib/appointments_table_extended.sql
# 2. Komplettes SQL ausführen
# 3. Prüfen: SELECT * FROM appointments LIMIT 1;
```

### 2. n8n Workflow (15 Min)

```bash
# 1. n8n öffnen: https://n8n.beautomated.at
# 2. Workflow importieren (aus docs/n8n-calendar-automation-workflow.md)
# 3. Credentials konfigurieren:
#    - Google Calendar OAuth2
#    - Gmail OAuth2
#    - Supabase API
# 4. Workflow aktivieren
# 5. Webhook-URL notieren
```

### 3. Frontend Integration (10 Min)

```bash
# 1. Environment Variable setzen
echo "VITE_CALENDAR_WEBHOOK_URL=https://n8n.beautomated.at/webhook/calendar-appointment" >> .env

# 2. Component in LeadDetail.tsx einbinden
```

```typescript
import { EnhancedAppointmentForm } from './EnhancedAppointmentForm'

// Button hinzufügen:
<button onClick={() => setShowAppointmentForm(true)}>
  📅 Termin vereinbaren
</button>

// Modal:
{showAppointmentForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <EnhancedAppointmentForm
      lead={lead}
      tenantId={activeTenantId}
      onSuccess={(result) => {
        setShowAppointmentForm(false)
        updateLead({ id: lead.id, lead_status: 'Termin vereinbart' })
      }}
      onCancel={() => setShowAppointmentForm(false)}
    />
  </div>
)}
```

### 4. Test durchführen (5 Min)

```bash
# Test-Request an Webhook
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

**Prüfen:**
- [ ] E-Mail erhalten?
- [ ] ICS-Datei im Anhang?
- [ ] Google Meet Link vorhanden (bei online)?
- [ ] Termin in Google Calendar?
- [ ] Eintrag in Supabase `appointments`?

---

## 📊 Feature-Übersicht

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Termin erstellen | ✅ | Datum, Zeit, Dauer, Notizen |
| Meeting-Types | ✅ | Vor Ort, Online, Telefon |
| Google Calendar | ✅ | Automatische Synchronisation |
| E-Mail-Einladung | ✅ | Mit ICS-Datei |
| Google Meet Links | ✅ | Bei Online-Terminen |
| 24h-Erinnerung | ✅ | Automatischer Cron-Job |
| Status-Tracking | ✅ | Gesendet/Geöffnet/Akzeptiert |
| Termin stornieren | ✅ | Mit Benachrichtigung |
| Multi-Tenant | ✅ | RLS-geschützt |
| Mobile-Optimiert | ✅ | Responsive Design |

---

## 🎨 UI/UX Highlights

### EnhancedAppointmentForm

**Design-Prinzipien:**
- ✨ Moderner, cleaner Look
- 🎯 Fokus auf Benutzerfreundlichkeit
- 📱 Mobile-first Responsive
- ⚡ Instant Feedback
- 🎨 Tailwind CSS

**User Flow:**
1. Termin-Details eingeben
2. Meeting-Art wählen
3. Optional: Einladung aktivieren
4. Kundendaten eingeben
5. Bestätigen → Feedback

**Conditional UI:**
- Adresse nur bei "Vor Ort"
- Meet-Link-Hinweis bei "Online"
- E-Mail-Felder nur wenn Einladung aktiviert

---

## 🔐 Sicherheit

### RLS Policies
```sql
-- Nur Termine im eigenen Tenant sichtbar
CREATE POLICY appointments_select ON appointments
  FOR SELECT USING (
    tenant_id IN (
      SELECT tm.tenant_id FROM tenant_memberships tm 
      WHERE tm.user_id = auth.uid()
    )
  );
```

### API-Schutz
- Webhook-Signatur-Validierung (optional)
- Rate-Limiting in n8n
- Service Role Key nur in n8n (nie Frontend!)
- Input-Validierung auf allen Ebenen

---

## 📈 Analytics & Reporting

### Vordefinierte Queries

**Einladungs-Performance:**
```sql
SELECT 
  DATE(invite_sent_at) as date,
  COUNT(*) as sent,
  COUNT(invite_accepted_at) as accepted,
  ROUND(100.0 * COUNT(invite_accepted_at) / COUNT(*), 2) as rate
FROM appointments
WHERE invite_sent_at IS NOT NULL
GROUP BY DATE(invite_sent_at);
```

**Beliebte Meeting-Types:**
```sql
SELECT meeting_type, COUNT(*) as count
FROM appointments
GROUP BY meeting_type
ORDER BY count DESC;
```

**No-Show Rate:**
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'no_show') * 100.0 / COUNT(*) as no_show_rate
FROM appointments
WHERE starts_at < NOW();
```

---

## 🛠️ Customization

### E-Mail-Templates anpassen

1. **Branding:**
   - Logo einfügen
   - Farben anpassen (`#10b981` → Corporate Color)
   - Footer-Infos aktualisieren

2. **Content:**
   - Tonalität anpassen (Du/Sie)
   - Zusätzliche Infos ergänzen
   - CTAs optimieren

3. **Platzhalter erweitern:**
   ```javascript
   // In n8n Function Node:
   .replace(/{{consultantName}}/g, $json.consultantName)
   .replace(/{{companyLogoUrl}}/g, 'https://...')
   ```

### Meeting-Types erweitern

```sql
-- In DB:
ALTER TABLE appointments 
DROP CONSTRAINT check_meeting_type;

ALTER TABLE appointments 
ADD CONSTRAINT check_meeting_type 
CHECK (meeting_type IN ('vor_ort', 'online', 'telefon', 'hybrid', 'workshop'));
```

```typescript
// In UI:
const [meetingType, setMeetingType] = useState<'vor_ort' | 'online' | 'telefon' | 'hybrid'>('vor_ort')
```

---

## 🐛 Bekannte Einschränkungen

1. **Google Meet nur mit Workspace:**
   - Kostenlose Gmail-Accounts können keine Meet-Links per API erstellen
   - Workaround: Zoom/Teams Integration

2. **E-Mail-Rate-Limits:**
   - Gmail: 500 E-Mails/Tag
   - Lösung: SMTP-Provider (SendGrid, Mailgun)

3. **Time-Zones:**
   - Aktuell nur `Europe/Berlin`
   - Erweiterung für Multi-Timezone in Planung

4. **ICS-Kompatibilität:**
   - Apple Calendar: ✅
   - Google Calendar: ✅
   - Outlook: ✅
   - Yahoo Mail: ⚠️ (eingeschränkt)

---

## 🔄 Roadmap / Next Steps

### Phase 2 (Optional)
- [ ] Outlook Calendar Integration
- [ ] Apple Calendar Integration
- [ ] Zoom Meeting Links
- [ ] SMS-Erinnerungen (Twilio)
- [ ] Termin-Rescheduling im Frontend
- [ ] Recurring Appointments
- [ ] Waiting-List bei vollen Slots
- [ ] Customer Self-Service Portal

### Phase 3 (Nice-to-Have)
- [ ] AI-gestützte Terminvorschläge
- [ ] Video-Message statt E-Mail
- [ ] WhatsApp Business Integration
- [ ] Calendar-Sync bidirektional
- [ ] Team-Kalender & Verfügbarkeit
- [ ] Automatische Follow-ups nach Termin

---

## 📞 Support & Fragen

**Dokumentation:**
- Setup: `docs/calendar-automation-setup.md`
- Workflows: `docs/n8n-calendar-automation-workflow.md`
- Templates: `docs/calendar-email-templates.md`

**Code:**
- Service: `src/lib/calendarService.ts`
- UI: `src/components/EnhancedAppointmentForm.tsx`
- Types: `src/types/appointments.ts`

**Bei Problemen:**
1. Logs in n8n prüfen
2. Supabase Database Logs checken
3. Browser-Console (F12)
4. Docs/Troubleshooting durchgehen

---

## ✅ Testing Checklist

Vor Go-Live alle durchgehen:

**Functional Tests:**
- [ ] Termin erstellen (ohne Einladung)
- [ ] Termin erstellen (mit Einladung)
- [ ] E-Mail empfangen
- [ ] ICS-Datei funktioniert
- [ ] Google Meet Link klickbar
- [ ] Termin in Google Calendar
- [ ] Termin in Supabase
- [ ] Erinnerung nach 24h
- [ ] Termin stornieren
- [ ] Storno-E-Mail erhalten

**Security Tests:**
- [ ] RLS: Kein Zugriff auf fremde Termine
- [ ] RLS: Nur eigener Tenant
- [ ] Webhook ohne Auth nicht aufrufbar
- [ ] XSS in Formular-Inputs verhindert
- [ ] SQL-Injection unmöglich

**Performance Tests:**
- [ ] 10 Termine parallel erstellen
- [ ] 100+ Termine in DB ohne Slowdown
- [ ] E-Mail-Versand < 5 Sekunden
- [ ] UI lädt < 1 Sekunde

---

**🎉 Viel Erfolg mit der Kalender-Automation!**

Bei Fragen oder Problemen → Issue erstellen oder Dokumentation durchsuchen.

