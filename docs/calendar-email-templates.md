# E-Mail-Templates für Kalender-Automation

## 1. Termin-Einladung (Initial Invite)

### Betreff
```
Terminbestätigung: Ihr Beratungstermin bei SolaVolta PV
```

### E-Mail-Body (HTML)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terminbestätigung</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
    }
    .appointment-details {
      background-color: #f0fdf4;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #10b981;
    }
    .detail-row {
      display: flex;
      padding: 8px 0;
    }
    .detail-label {
      font-weight: bold;
      min-width: 120px;
      color: #059669;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 10px 5px;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #059669;
    }
    .button-secondary {
      background-color: #3b82f6;
    }
    .button-secondary:hover {
      background-color: #2563eb;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #6b7280;
    }
    .important-note {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ SolaVolta PV</div>
      <p style="color: #6b7280; margin: 10px 0 0 0;">Ihr Partner für nachhaltige Energie</p>
    </div>

    <h2 style="color: #059669; margin-top: 30px;">Guten Tag {{customerName}},</h2>
    
    <p>vielen Dank für Ihr Interesse an einer Photovoltaik-Anlage! Wir freuen uns, Sie persönlich beraten zu dürfen.</p>

    <div class="appointment-details">
      <h3 style="margin-top: 0; color: #059669;">📅 Ihre Termindetails:</h3>
      <div class="detail-row">
        <span class="detail-label">Datum:</span>
        <span>{{appointmentDate}}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Uhrzeit:</span>
        <span>{{appointmentTime}} Uhr</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Dauer:</span>
        <span>{{duration}} Minuten</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Art:</span>
        <span>{{meetingTypeLabel}}</span>
      </div>
      {{#if location}}
      <div class="detail-row">
        <span class="detail-label">Ort:</span>
        <span>{{location}}</span>
      </div>
      {{/if}}
      {{#if meetingLink}}
      <div class="detail-row">
        <span class="detail-label">Meeting-Link:</span>
        <span><a href="{{meetingLink}}" style="color: #2563eb;">{{meetingLink}}</a></span>
      </div>
      {{/if}}
      {{#if consultantName}}
      <div class="detail-row">
        <span class="detail-label">Ihr Berater:</span>
        <span>{{consultantName}}</span>
      </div>
      {{/if}}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{calendarLink}}" class="cta-button">📅 Zum Kalender hinzufügen</a>
      {{#if meetingLink}}
      <a href="{{meetingLink}}" class="cta-button button-secondary">🎥 Meeting beitreten</a>
      {{/if}}
    </div>

    <div class="important-note">
      <strong>💡 Gut zu wissen:</strong>
      <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li>Bitte halten Sie Ihre letzte Stromrechnung bereit</li>
        <li>Wenn möglich: Fotos Ihres Dachs</li>
        <li>Ihre Wünsche und Fragen notieren</li>
      </ul>
    </div>

    {{#if notes}}
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <strong>📝 Notizen:</strong>
      <p style="margin: 10px 0 0 0;">{{notes}}</p>
    </div>
    {{/if}}

    <p style="margin-top: 30px;">
      <strong>Termin ändern oder absagen?</strong><br>
      Kein Problem! Rufen Sie uns einfach an oder antworten Sie auf diese E-Mail.
    </p>

    <div class="footer">
      <p><strong>SolaVolta PV GmbH</strong></p>
      <p>
        📧 info@solavolta.de | 📞 +49 (0) 123 456789<br>
        🌐 www.solavolta.de
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
        Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail, 
        sondern nutzen Sie die angegebenen Kontaktdaten.
      </p>
    </div>
  </div>
</body>
</html>
```

### Plain-Text Version
```
Guten Tag {{customerName}},

vielen Dank für Ihr Interesse an einer Photovoltaik-Anlage!

IHRE TERMINDETAILS:
-------------------
Datum: {{appointmentDate}}
Uhrzeit: {{appointmentTime}} Uhr
Dauer: {{duration}} Minuten
Art: {{meetingTypeLabel}}
{{#if location}}Ort: {{location}}{{/if}}
{{#if meetingLink}}Meeting-Link: {{meetingLink}}{{/if}}

ZUM KALENDER HINZUFÜGEN:
{{calendarLink}}

GUT ZU WISSEN:
- Bitte halten Sie Ihre letzte Stromrechnung bereit
- Wenn möglich: Fotos Ihres Dachs
- Ihre Wünsche und Fragen notieren

{{#if notes}}
NOTIZEN:
{{notes}}
{{/if}}

Termin ändern oder absagen?
Kein Problem! Rufen Sie uns an: +49 (0) 123 456789

Mit freundlichen Grüßen
Ihr SolaVolta PV Team

---
SolaVolta PV GmbH
info@solavolta.de | +49 (0) 123 456789
www.solavolta.de
```

---

## 2. Terminerinnerung (24h vorher)

### Betreff
```
Erinnerung: Ihr Termin bei SolaVolta PV morgen um {{appointmentTime}} Uhr
```

### E-Mail-Body (HTML)

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .reminder-badge {
      background-color: #3b82f6;
      color: white;
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .appointment-summary {
      background-color: #eff6ff;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      margin: 20px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 10px 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="reminder-badge">⏰ Terminerinnerung</div>
    
    <h2 style="color: #1e40af;">Hallo {{customerName}},</h2>
    
    <p style="font-size: 18px;">
      <strong>Wir freuen uns auf Ihren Termin morgen!</strong>
    </p>

    <div class="appointment-summary">
      <p style="margin: 0; font-size: 16px;">
        <strong>📅 {{appointmentDate}}</strong><br>
        <strong>🕐 {{appointmentTime}} Uhr</strong>
      </p>
      {{#if location}}
      <p style="margin: 15px 0 0 0;">
        📍 {{location}}
      </p>
      {{/if}}
      {{#if meetingLink}}
      <p style="margin: 15px 0 0 0;">
        🎥 <a href="{{meetingLink}}" style="color: #2563eb;">Meeting beitreten</a>
      </p>
      {{/if}}
    </div>

    <p>
      <strong>Checkliste für Ihr Beratungsgespräch:</strong>
    </p>
    <ul>
      <li>✅ Letzte Stromrechnung</li>
      <li>✅ Dachfotos (falls vorhanden)</li>
      <li>✅ Ihre Fragen notiert</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      {{#if meetingLink}}
      <a href="{{meetingLink}}" class="cta-button">🎥 Jetzt beitreten</a>
      {{/if}}
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Sollten Sie verhindert sein, geben Sie uns bitte rechtzeitig Bescheid:<br>
      📞 +49 (0) 123 456789 | 📧 info@solavolta.de
    </p>

    <p style="margin-top: 30px;">
      Bis morgen!<br>
      <strong>Ihr SolaVolta PV Team</strong>
    </p>
  </div>
</body>
</html>
```

---

## 3. Termin-Stornierung

### Betreff
```
Termin abgesagt: {{appointmentDate}} um {{appointmentTime}} Uhr
```

### E-Mail-Body

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .cancellation-notice {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b981;
      color: white;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2 style="color: #dc2626;">Terminabsage</h2>
    
    <p>Guten Tag {{customerName}},</p>

    <div class="cancellation-notice">
      <p style="margin: 0;">
        <strong>Ihr Termin wurde storniert:</strong><br><br>
        📅 {{appointmentDate}}<br>
        🕐 {{appointmentTime}} Uhr
      </p>
      {{#if reason}}
      <p style="margin: 15px 0 0 0;">
        <strong>Grund:</strong> {{reason}}
      </p>
      {{/if}}
    </div>

    <p>
      Möchten Sie einen neuen Termin vereinbaren?<br>
      Wir stehen Ihnen gerne zur Verfügung!
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://solavolta.de/termin-buchen" class="cta-button">📅 Neuen Termin vereinbaren</a>
    </div>

    <p>
      Sie erreichen uns auch telefonisch:<br>
      📞 +49 (0) 123 456789
    </p>

    <p style="margin-top: 30px;">
      Mit freundlichen Grüßen<br>
      <strong>Ihr SolaVolta PV Team</strong>
    </p>
  </div>
</body>
</html>
```

---

## Template-Variablen

### Verfügbare Platzhalter
- `{{customerName}}` - Name des Kunden
- `{{appointmentDate}}` - Formatiertes Datum (z.B. "Montag, 15. Januar 2025")
- `{{appointmentTime}}` - Uhrzeit (z.B. "14:30")
- `{{duration}}` - Dauer in Minuten
- `{{meetingTypeLabel}}` - "Vor-Ort-Termin", "Online-Meeting" oder "Telefontermin"
- `{{location}}` - Adresse für Vor-Ort-Termine
- `{{meetingLink}}` - Google Meet / Zoom Link
- `{{calendarLink}}` - ICS-Download oder Add-to-Calendar Link
- `{{consultantName}}` - Name des Beraters
- `{{notes}}` - Zusätzliche Notizen
- `{{reason}}` - Stornierungsgrund

## n8n Integration

Diese Templates werden in n8n verwendet mit dem **Send Email (SMTP)** Node oder **Gmail Node**.

### Beispiel n8n-Konfiguration:

```json
{
  "to": "{{$json.customerEmail}}",
  "subject": "Terminbestätigung: Ihr Beratungstermin bei SolaVolta PV",
  "emailFormat": "html",
  "html": "<hier HTML-Template einfügen>",
  "attachments": [
    {
      "name": "termin.ics",
      "content": "{{$json.icsFile}}"
    }
  ]
}
```

