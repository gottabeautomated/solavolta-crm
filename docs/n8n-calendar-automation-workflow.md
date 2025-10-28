# n8n Workflow: Kalender-Automation

## Übersicht

Dieser n8n Workflow automatisiert die Erstellung von Terminen in Google Calendar und versendet automatische Einladungen mit ICS-Dateien an Kunden.

## Workflow-Architektur

```
┌─────────────────┐
│  Webhook Trigger│
│  /calendar-     │
│  appointment    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Input  │
│ (Function Node) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Google   │
│ Calendar Event  │
│ (Google Calendar│
│     API)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate ICS    │
│ File (Function) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render Email    │
│ Template        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Send Email      │
│ with Invite     │
│ (SMTP/Gmail)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Supabase │
│ appointments    │
│ table           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Response │
└─────────────────┘
```

## 1. Webhook Trigger

**Node:** Webhook
**Path:** `/webhook/calendar-appointment`
**Method:** POST

### Erwartete Input-Struktur:

```json
{
  "leadId": "uuid",
  "tenantId": "uuid",
  "customerName": "Max Mustermann",
  "customerEmail": "max@example.com",
  "customerPhone": "+49 123 456789",
  "startDateTime": "2025-01-15T14:00:00Z",
  "endDateTime": "2025-01-15T15:00:00Z",
  "timeZone": "Europe/Berlin",
  "durationMinutes": 60,
  "meetingType": "vor_ort",
  "location": "Musterstraße 123, 12345 Berlin",
  "notes": "Kunde interessiert sich für 10kWp Anlage",
  "sendInvite": true
}
```

## 2. Validate Input (Function Node)

```javascript
// Validierung der Eingabedaten
const required = ['leadId', 'tenantId', 'customerEmail', 'startDateTime', 'endDateTime'];
const missing = required.filter(field => !$input.item.json[field]);

if (missing.length > 0) {
  throw new Error(`Fehlende Pflichtfelder: ${missing.join(', ')}`);
}

// E-Mail-Validierung
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test($input.item.json.customerEmail)) {
  throw new Error('Ungültige E-Mail-Adresse');
}

// Zeitvalidierung
const start = new Date($input.item.json.startDateTime);
const end = new Date($input.item.json.endDateTime);
if (start >= end) {
  throw new Error('Endzeit muss nach Startzeit liegen');
}

// Meeting-Type Label
const meetingTypeLabels = {
  'vor_ort': 'Vor-Ort-Termin',
  'online': 'Online-Meeting',
  'telefon': 'Telefontermin'
};

return {
  json: {
    ...$input.item.json,
    meetingTypeLabel: meetingTypeLabels[$input.item.json.meetingType] || 'Termin',
    validated: true
  }
};
```

## 3. Create Google Calendar Event

**Node:** Google Calendar
**Operation:** Create Event
**Credentials:** OAuth2 Google

### Konfiguration:

```javascript
{
  "calendar": "primary",
  "summary": `Beratungstermin: ${$json.customerName}`,
  "description": `Lead: ${$json.leadId}\nNotizen: ${$json.notes || 'Keine'}`,
  "location": $json.location || '',
  "start": {
    "dateTime": $json.startDateTime,
    "timeZone": $json.timeZone
  },
  "end": {
    "dateTime": $json.endDateTime,
    "timeZone": $json.timeZone
  },
  "attendees": [
    {
      "email": $json.customerEmail,
      "displayName": $json.customerName,
      "responseStatus": "needsAction"
    }
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },  // 24h vorher
      { "method": "popup", "minutes": 60 }     // 1h vorher
    ]
  },
  "sendUpdates": "none",  // Wichtig: Einladung wird manuell versendet
  "conferenceData": $json.meetingType === 'online' ? {
    "createRequest": {
      "requestId": `meet-${Date.now()}`,
      "conferenceSolutionKey": {
        "type": "hangoutsMeet"
      }
    }
  } : undefined
}
```

**Wichtig:** `conferenceDataVersion` auf `1` setzen für Google Meet Links!

## 4. Generate ICS File (Function Node)

```javascript
// ICS-Datei für Kalendereinladung erstellen
const moment = require('moment-timezone');

const startDate = moment($json.startDateTime).tz($json.timeZone);
const endDate = moment($json.endDateTime).tz($json.timeZone);

const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SolaVolta PV//Calendar//DE
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${$json.leadId}-${Date.now()}@solavolta.de
DTSTAMP:${moment().utc().format('YYYYMMDDTHHmmss')}Z
DTSTART;TZID=${$json.timeZone}:${startDate.format('YYYYMMDDTHHmmss')}
DTEND;TZID=${$json.timeZone}:${endDate.format('YYYYMMDDTHHmmss')}
SUMMARY:Beratungstermin SolaVolta PV
DESCRIPTION:${$json.notes || 'Beratungsgespräch zu Photovoltaik-Lösungen'}
LOCATION:${$json.location || ''}
ORGANIZER;CN=SolaVolta PV:mailto:info@solavolta.de
ATTENDEE;CN=${$json.customerName};RSVP=TRUE:mailto:${$json.customerEmail}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:Terminerinnerung
TRIGGER:-PT24H
END:VALARM
END:VEVENT
END:VCALENDAR`;

// Base64 kodieren für E-Mail-Anhang
const icsBase64 = Buffer.from(icsContent).toString('base64');

return {
  json: {
    ...$json,
    calendarEventId: $input.item.json.id,  // Von Google Calendar
    calendarLink: $input.item.json.htmlLink,
    meetingLink: $input.item.json.hangoutLink || null,
    icsFile: icsBase64,
    icsContent: icsContent
  }
};
```

## 5. Render Email Template (Function Node)

```javascript
// Template mit Daten befüllen
const moment = require('moment');
moment.locale('de');

const appointmentDate = moment($json.startDateTime).format('dddd, DD. MMMM YYYY');
const appointmentTime = moment($json.startDateTime).format('HH:mm');

// HTML-Template laden (aus File oder Variable)
let htmlTemplate = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <style>
    /* Styles aus calendar-email-templates.md hier einfügen */
  </style>
</head>
<body>
  <div class="container">
    <!-- Template-Inhalt aus calendar-email-templates.md -->
  </div>
</body>
</html>`;

// Platzhalter ersetzen
htmlTemplate = htmlTemplate
  .replace(/{{customerName}}/g, $json.customerName)
  .replace(/{{appointmentDate}}/g, appointmentDate)
  .replace(/{{appointmentTime}}/g, appointmentTime)
  .replace(/{{duration}}/g, $json.durationMinutes)
  .replace(/{{meetingTypeLabel}}/g, $json.meetingTypeLabel)
  .replace(/{{location}}/g, $json.location || 'Wird noch bekannt gegeben')
  .replace(/{{meetingLink}}/g, $json.meetingLink || '')
  .replace(/{{calendarLink}}/g, $json.calendarLink)
  .replace(/{{notes}}/g, $json.notes || '');

// Conditional Blocks (if)
if (!$json.location) {
  htmlTemplate = htmlTemplate.replace(/{{#if location}}[\s\S]*?{{\/if}}/g, '');
}
if (!$json.meetingLink) {
  htmlTemplate = htmlTemplate.replace(/{{#if meetingLink}}[\s\S]*?{{\/if}}/g, '');
}

return {
  json: {
    ...$json,
    emailSubject: `Terminbestätigung: Ihr Beratungstermin bei SolaVolta PV`,
    emailHtml: htmlTemplate
  }
};
```

## 6. Send Email (Gmail / SMTP Node)

**Node:** Gmail (oder Send Email)
**Operation:** Send

### Gmail-Konfiguration:

```javascript
{
  "to": $json.customerEmail,
  "subject": $json.emailSubject,
  "message": "",  // Leer lassen bei HTML
  "options": {
    "htmlBody": $json.emailHtml,
    "attachments": [
      {
        "name": "termin.ics",
        "data": $json.icsFile,
        "encoding": "base64",
        "contentType": "text/calendar; method=REQUEST"
      }
    ]
  }
}
```

### Alternative: SMTP Node

```javascript
{
  "to": $json.customerEmail,
  "subject": $json.emailSubject,
  "emailFormat": "html",
  "html": $json.emailHtml,
  "attachments": `name:termin.ics;data:${$json.icsFile};encoding:base64;contentType:text/calendar`
}
```

## 7. Update Supabase (HTTP Request Node)

**Node:** HTTP Request
**Method:** POST
**URL:** `https://YOUR_PROJECT.supabase.co/rest/v1/appointments`
**Headers:**
- `apikey`: Supabase Anon Key
- `Authorization`: `Bearer YOUR_SERVICE_ROLE_KEY`
- `Content-Type`: `application/json`
- `Prefer`: `return=representation`

### Body:

```javascript
{
  "id": $json.appointmentId || undefined,  // Falls bereits erstellt
  "lead_id": $json.leadId,
  "tenant_id": $json.tenantId,
  "starts_at": $json.startDateTime,
  "duration_minutes": $json.durationMinutes,
  "meeting_type": $json.meetingType,
  "location": $json.location,
  "meeting_link": $json.meetingLink,
  "notes": $json.notes,
  "calendar_event_id": $json.calendarEventId,
  "calendar_provider": "google",
  "customer_email": $json.customerEmail,
  "customer_phone": $json.customerPhone,
  "invite_sent_at": new Date().toISOString(),
  "status": "scheduled"
}
```

**Alternative Update (falls ID vorhanden):**

**Method:** PATCH
**URL:** `https://YOUR_PROJECT.supabase.co/rest/v1/appointments?id=eq.${$json.appointmentId}`

## 8. Return Response (Respond to Webhook Node)

```javascript
{
  "success": true,
  "appointmentId": $json.id || $json.appointmentId,
  "calendarEventId": $json.calendarEventId,
  "calendarLink": $json.calendarLink,
  "meetingLink": $json.meetingLink,
  "inviteSentAt": $json.invite_sent_at || new Date().toISOString()
}
```

## Error Handling

Füge **Error Trigger** Node hinzu:

```javascript
{
  "success": false,
  "error": $json.error?.message || 'Ein Fehler ist aufgetreten',
  "details": $json.error
}
```

## Zusatz-Workflows

### Workflow 2: Terminerinnerung (24h vorher)

**Trigger:** Cron (täglich um 9:00 Uhr)

1. **Supabase Query:** Hole Termine für morgen
2. **Loop über Termine**
3. **Render Reminder-Template**
4. **Send Reminder Email**
5. **Update `reminder_sent_at`**

### Workflow 3: Termin-Stornierung

**Trigger:** Webhook `/cancel-appointment`

1. **Delete Google Calendar Event**
2. **Send Cancellation Email**
3. **Update Supabase Status** → `cancelled`

## Umgebungsvariablen (n8n)

```bash
GOOGLE_CALENDAR_CLIENT_ID=xxx
GOOGLE_CALENDAR_CLIENT_SECRET=xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@solavolta.de
SMTP_PASSWORD=xxx
```

## Testing

### Test-Request (cURL):

```bash
curl -X POST https://n8n.beautomated.at/webhook/calendar-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "123e4567-e89b-12d3-a456-426614174000",
    "tenantId": "a0668e3e-d954-40e9-bcdd-bd47566d2b1f",
    "customerName": "Max Mustermann",
    "customerEmail": "max@example.com",
    "startDateTime": "2025-01-20T14:00:00+01:00",
    "endDateTime": "2025-01-20T15:00:00+01:00",
    "timeZone": "Europe/Berlin",
    "durationMinutes": 60,
    "meetingType": "online",
    "notes": "Test-Termin",
    "sendInvite": true
  }'
```

## Deployment-Checkliste

- [ ] Google Calendar API aktiviert
- [ ] OAuth2 Credentials erstellt
- [ ] SMTP/Gmail konfiguriert
- [ ] Supabase Service Role Key hinterlegt
- [ ] Email-Templates angepasst (Branding)
- [ ] Test-Durchlauf erfolgreich
- [ ] Error-Handling getestet
- [ ] Cron-Job für Erinnerungen aktiviert

