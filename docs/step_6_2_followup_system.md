# Step 6.2: Follow-up Reminder System

## 🎯 Ziel
Automatisches Follow-up Reminder System implementieren, das täglich überfällige Follow-ups überwacht und Benachrichtigungen via E-Mail und optional Telegram sendet.

## 📋 Checkliste

### Follow-up Monitoring System
- [ ] Täglich Scheduler für Follow-up Check
- [ ] Überfällige Follow-ups identifizieren
- [ ] E-Mail Benachrichtigungen senden
- [ ] Telegram Bot Integration (optional)
- [ ] Follow-up Status-Management

### Benachrichtigungs-Templates
- [ ] E-Mail Templates für verschiedene Szenarien
- [ ] Telegram Message Templates
- [ ] Eskalations-Nachrichten
- [ ] Summary Reports

### Frontend Integration
- [ ] Follow-up Dashboard
- [ ] Snooze/Postpone Funktionalität
- [ ] Bulk Follow-up Actions
- [ ] Notification Settings

### Termine (mehrere pro Lead)
- [ ] Tabelle `appointments` + RLS + Indizes
- [ ] View `lead_next_appointments`
- [ ] Anzeige aller Termine im Lead-Detail
- [ ] In der Lead-Liste nur nächster Termin

### Advanced Features
- [ ] Eskalations-Regeln (3, 7, 14 Tage)
- [ ] Follow-up Kategorien
- [ ] Automatic Lead Status Changes
- [ ] Integration mit Kalender

## 🔧 n8n Workflows

### 1. **Daily Follow-up Check** (`daily-followup-check.json`)
```json
{
  "name": "Daily Follow-up Reminder System",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "value": "0 8 * * 1-5"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.1,
      "position": [240, 300],
      "name": "Daily at 8 AM (Weekdays)"
    },
    {
      "parameters": {
        "operation": "select",
        "table": "leads",
        "conditions": {
          "conditions": [
            {
              "column": "follow_up",
              "condition": "equal",
              "value": true
            },
            {
              "column": "follow_up_date",
              "condition": "smallerEqual",
              "value": "={{ $now.format('YYYY-MM-DD') }}"
            },
            {
              "column": "lead_status",
              "condition": "notEqual",
              "value": "Gewonnen"
            },
            {
              "column": "lead_status",
              "condition": "notEqual", 
              "value": "Verloren"
            }
          ],
          "combinator": "and"
        }
      },
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [460, 300],
      "name": "Get Overdue Follow-ups",
      "credentials": {
        "supabaseApi": {
          "id": "supabase-connection",
          "name": "Supabase Lead Dashboard"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict"
          },
          "conditions": [
            {
              "leftValue": "={{ $json.length }}",
              "rightValue": 0,
              "operator": {
                "type": "number",
                "operation": "gt"
              }
            }
          ],
          "combinator": "and"
        }
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2,
      "position": [680, 300],
      "name": "Any Follow-ups Due?"
    },
    {
      "parameters": {
        "jsCode": "// Kategorisiere Follow-ups nach Dringlichkeit\nconst leads = $input.all().map(item => item.json);\nconst today = new Date();\ntoday.setHours(0, 0, 0, 0);\n\nconst categorized = {\n  today: [],\n  overdue_1_3: [], // 1-3 Tage überfällig\n  overdue_4_7: [], // 4-7 Tage überfällig\n  overdue_week_plus: [] // > 7 Tage überfällig\n};\n\nleads.forEach(lead => {\n  const followUpDate = new Date(lead.follow_up_date);\n  followUpDate.setHours(0, 0, 0, 0);\n  \n  const daysDiff = Math.floor((today - followUpDate) / (1000 * 60 * 60 * 24));\n  \n  if (daysDiff === 0) {\n    categorized.today.push(lead);\n  } else if (daysDiff >= 1 && daysDiff <= 3) {\n    categorized.overdue_1_3.push(lead);\n  } else if (daysDiff >= 4 && daysDiff <= 7) {\n    categorized.overdue_4_7.push(lead);\n  } else if (daysDiff > 7) {\n    categorized.overdue_week_plus.push(lead);\n  }\n});\n\nreturn [{\n  summary: {\n    total: leads.length,\n    today: categorized.today.length,\n    overdue_1_3: categorized.overdue_1_3.length,\n    overdue_4_7: categorized.overdue_4_7.length,\n    overdue_week_plus: categorized.overdue_week_plus.length\n  },\n  categorized: categorized,\n  date: today.toISOString().split('T')[0]\n}];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [900, 200],
      "name": "Categorize Follow-ups"
    },
    {
      "parameters": {
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "emailPasswordApi",
        "subject": "🔔 Follow-up Reminder - {{ $('Categorize Follow-ups').first().json.summary.total }} Leads",
        "message": "=<!DOCTYPE html>\n<html>... (gekürzt für Übersicht) ...</html>",
        "options": { "allowUnauthorizedCerts": false, "html": true },
        "fromEmail": "jonas.behrmann@googlemail.com",
        "toEmail": "jonas.behrmann@googlemail.com"
      },
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [1120, 200],
      "name": "Send Follow-up Email",
      "credentials": { "emailPasswordApi": { "id": "gmail-credentials", "name": "Gmail Jonas" } }
    }
  ],
  "connections": { "Daily at 8 AM (Weekdays)": { "main": [[{ "node": "Get Overdue Follow-ups", "type": "main", "index": 0 }]] }, "Get Overdue Follow-ups": { "main": [[{ "node": "Any Follow-ups Due?", "type": "main", "index": 0 }]] }, "Any Follow-ups Due?": { "main": [[{ "node": "Categorize Follow-ups", "type": "main", "index": 0 }]] }, "Categorize Follow-ups": { "main": [[{ "node": "Send Follow-up Email", "type": "main", "index": 0 }]] } },
  "active": true,
  "settings": { "executionOrder": "v1" }
}
```

### 2. **Weekly Follow-up Summary** (`weekly-followup-summary.json`)
```json
{ "name": "Weekly Follow-up Summary Report", "active": true }
```

## 🔧 Frontend Integration

### Follow-up Management Service
```typescript
// src/lib/followupService.ts
export interface FollowupReminder { /* ...siehe Anhang Step 6.2... */ }
```

### Follow-up Dashboard Component
```typescript
// src/components/FollowupDashboard.tsx
export function FollowupDashboard() { /* ...siehe Anhang Step 6.2... */ }
```

### Snooze Follow-up Component
```typescript
// src/components/SnoozeFollowup.tsx
export function SnoozeFollowup() { /* ...siehe Anhang Step 6.2... */ }
```

## 🧪 Setup & Testing

1) Gmail Credentials in n8n anlegen (App‑Passwort)
2) Telegram Bot optional einrichten
3) Workflows importieren und Cron anpassen
4) Frontend‑Dashboard testen

## ✅ Definition of Done
- [ ] Daily Follow-up Check läuft und sendet E-Mails
- [ ] Weekly Summary Report versendet
- [ ] Telegram Alerts (optional)
- [ ] Follow-up Dashboard und Snooze im Frontend

## 🔗 Nächster Step
Step 6.3: SAP-Export Automation & Reporting


